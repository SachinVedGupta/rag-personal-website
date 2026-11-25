"""Fetch the pinned MiniLM files during deployment, before the server starts."""
from hashlib import sha256
import os
from pathlib import Path
from tempfile import NamedTemporaryFile
from typing import BinaryIO
from urllib.request import urlopen

MODEL_REVISION = "1110a243fdf4706b3f48f1d95db1a4f5529b4d41"
MODEL_URL = (
    "https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2/resolve/"
    + MODEL_REVISION
)
FULL_ASSETS = {
    "tokenizer.json": ("tokenizer.json", "be50c3628f2bf5bb5e3a7f17b1f74611b2561a3a27eeab05e5aa30f411572037"),
    "model.onnx": ("onnx/model.onnx", "6fd5d72fe4589f189f8ebc006442dbb529bb7ce38f8082112682524616046452"),
}

QUANTIZED_MODEL = (
    "onnx/model_quint8_avx2.onnx",
    "b941bf19f1f1283680f449fa6a7336bb5600bdcd5f84d10ddc5cd72218a0fd21",
)


def model_directory() -> Path:
    return Path(os.environ.get("RAG_V2_MODEL_DIR") or Path(__file__).with_name("model"))


def main() -> None:
    directory = model_directory()
    directory.mkdir(parents=True, exist_ok=True)
    assets = FULL_ASSETS.copy()
    if os.environ.get("RAG_V2_QUANTIZED_MODEL") == "1":
        assets["model.onnx"] = QUANTIZED_MODEL
    for name, (remote_path, expected_hash) in assets.items():
        destination = directory / name
        if destination.is_file():
            with destination.open("rb") as existing:
                if sha256_file(existing) == expected_hash:
                    continue
        with NamedTemporaryFile(dir=directory, delete=False) as pending:
            temporary = Path(pending.name)
            try:
                with urlopen(f"{MODEL_URL}/{remote_path}", timeout=30) as response:
                    while chunk := response.read(1024 * 1024):
                        pending.write(chunk)
                pending.seek(0)
                if sha256_file(pending) != expected_hash:
                    raise RuntimeError(f"MiniLM checksum failed for {name}")
                temporary.chmod(0o644)
                temporary.replace(destination)
            finally:
                temporary.unlink(missing_ok=True)


def sha256_file(file: BinaryIO) -> str:
    checksum = sha256()
    while chunk := file.read(1024 * 1024):
        checksum.update(chunk)
    return checksum.hexdigest()


if __name__ == "__main__":
    main()

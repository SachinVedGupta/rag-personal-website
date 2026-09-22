import type { ReactNode } from "react";

const SAFE_URL = "(?:https?:\\/\\/|\\/(?!\\/))[^)]+";
const TOKEN = new RegExp(
  `(!\\[[^\\]]*\\]\\(${SAFE_URL}\\)|\\*\\*[^*]+\\*\\*|\\[[^\\]]+\\]\\(${SAFE_URL}\\))`,
  "g",
);

function inline(text: string): ReactNode[] {
  return text.split(TOKEN).filter(Boolean).map((part, index) => {
    const image = part.match(/^!\[([^\]]*)\]\(((?:https?:\/\/|\/(?!\/))[^)]+)\)$/);
    if (image) {
      return (
        <span key={index} className="my-3 block overflow-hidden rounded-xl border border-slate-200 bg-white">
          <img src={image[2]} alt={image[1] || "Portfolio media"} className="max-h-72 w-full object-cover" />
          {image[1] && <span className="block px-3 py-2 text-xs text-slate-500">{image[1]}</span>}
        </span>
      );
    }
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-semibold text-slate-950">
          {part.slice(2, -2)}
        </strong>
      );
    }
    const link = part.match(/^\[([^\]]+)\]\(((?:https?:\/\/|\/(?!\/))[^)]+)\)$/);
    if (link) {
      return (
        <a
          key={index}
          href={link[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-blue-700 underline decoration-blue-300 underline-offset-2 hover:text-blue-900"
        >
          {link[1]}
        </a>
      );
    }
    return part;
  });
}

export default function SafeMarkdown({ text }: { text: string }) {
  const blocks = text.split(/\n\s*\n/).filter(Boolean);
  return (
    <div className="space-y-3">
      {blocks.map((block, index) => {
        const lines = block.split("\n").filter(Boolean);
        if (lines.length > 0 && lines.every((line) => /^[-*]\s+/.test(line))) {
          return (
            <ul key={index} className="list-disc space-y-1 pl-5">
              {lines.map((line, lineIndex) => (
                <li key={lineIndex}>{inline(line.replace(/^[-*]\s+/, ""))}</li>
              ))}
            </ul>
          );
        }
        return <p key={index}>{inline(lines.join(" "))}</p>;
      })}
    </div>
  );
}

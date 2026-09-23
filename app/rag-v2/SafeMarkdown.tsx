import type { ReactNode } from "react";

const SAFE_URL = "(?:https?:\\/\\/|\\/(?!\\/))[^)]+";
const TOKEN = new RegExp(
  `(!\\[[^\\]]*\\]\\(${SAFE_URL}\\)|\\*\\*[^*]+\\*\\*|\\[[^\\]]+\\]\\(${SAFE_URL}\\))`,
  "g",
);

function normalizeMarkdown(text: string) {
  const url = "((?:https?:\\/\\/|\\/(?!\\/))[^)\\s]+)";
  return text
    // Repair the model's occasionally over-nested bold/link form into one ordinary link.
    .replace(
      new RegExp(`\\*\\*\\[([^\\]]+)\\]\\\\?\\(\\*\\*\\[\\*\\*([^\\]]+)\\*\\*\\]\\(${url}\\)\\*\\*\\\\?\\)\\*\\*`, "g"),
      "[$1]($3)",
    )
    // Bold wrappers around links and images interrupt tokenization; keep the media token intact.
    .replace(new RegExp(`\\*\\*((?:!\\[[^\\]]*\\]|\\[[^\\]]+\\])\\(${url}\\))\\*\\*`, "g"), "$1")
    .replace(new RegExp(`\\[\\*\\*([^\\]]+)\\*\\*\\]\\(${url}\\)`, "g"), "[$1]($2)");
}

function inline(text: string, darkTheme: boolean): ReactNode[] {
  return text.split(TOKEN).filter(Boolean).map((part, index) => {
    const image = part.match(/^!\[([^\]]*)\]\(((?:https?:\/\/|\/(?!\/))[^)]+)\)$/);
    if (image) {
      return (
        <span key={index} className={`my-3 block overflow-hidden rounded-xl border ${darkTheme ? "border-blue-700 bg-[#061426]" : "border-slate-200 bg-white"}`}>
          <img src={image[2]} alt={image[1] || "Portfolio media"} className="max-h-72 w-full object-cover" />
          {image[1] && <span className={`block px-3 py-2 text-xs ${darkTheme ? "text-blue-100/85" : "text-slate-600"}`}>{image[1]}</span>}
        </span>
      );
    }
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className={`font-semibold ${darkTheme ? "text-white" : "text-slate-950"}`}>
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
          className={`inline-flex max-w-full break-words rounded-md border px-1.5 py-0.5 font-semibold underline decoration-1 underline-offset-2 transition ${darkTheme ? "border-blue-500/50 bg-blue-900/50 text-sky-200 decoration-sky-300 hover:border-blue-300 hover:bg-blue-800/70 hover:text-white" : "border-blue-200 bg-blue-50 text-blue-800 decoration-blue-500 hover:border-blue-400 hover:bg-blue-100 hover:text-blue-950"}`}
        >
          {link[1]}
        </a>
      );
    }
    return part;
  });
}

export default function SafeMarkdown({ text, darkTheme = false }: { text: string; darkTheme?: boolean }) {
  const blocks = normalizeMarkdown(text).split(/\n\s*\n/).filter(Boolean);
  return (
    <div className="space-y-3">
      {blocks.map((block, index) => {
        const lines = block.split("\n").filter(Boolean);
        const inlineBullets = lines.length === 1 && /^[-*]\s+/.test(lines[0])
          ? lines[0].replace(/^[-*]\s+/, "").split(/\s+[-*]\s+/).filter(Boolean)
          : null;
        if (inlineBullets || (lines.length > 0 && lines.every((line) => /^[-*]\s+/.test(line)))) {
          const items = inlineBullets || lines.map((line) => line.replace(/^[-*]\s+/, ""));
          return (
            <ul key={index} className="list-disc space-y-1 pl-5">
              {items.map((item, lineIndex) => (
                <li key={lineIndex}>{inline(item, darkTheme)}</li>
              ))}
            </ul>
          );
        }
        return <p key={index}>{inline(lines.join(" "), darkTheme)}</p>;
      })}
    </div>
  );
}

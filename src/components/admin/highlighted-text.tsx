import { getHighlightedChunks } from "@/lib/highlight";
import { cn } from "@/lib/utils";

export function HighlightedText({
  text,
  query,
  className,
}: {
  text: string;
  query: string;
  className?: string;
}) {
  if (!query || !query.trim()) {
    return <span className={className}>{text}</span>;
  }

  const chunks = getHighlightedChunks(text, query);

  return (
    <span className={className}>
      {chunks.map((chunk, idx) =>
        chunk.isMatch ? (
          <mark
            key={idx}
            className="rounded bg-amber-400/25 px-0.5 font-medium text-ink dark:bg-amber-500/30"
          >
            {chunk.text}
          </mark>
        ) : (
          <span key={idx}>{chunk.text}</span>
        )
      )}
    </span>
  );
}

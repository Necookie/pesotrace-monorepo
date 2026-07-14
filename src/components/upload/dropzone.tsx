"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function Dropzone({
  multiple,
  onFiles,
}: {
  multiple: boolean;
  onFiles: (files: File[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  function handleFiles(fileList: FileList | null) {
    if (!fileList) return;
    const files = Array.from(fileList).filter((f) =>
      ["image/png", "image/jpeg"].includes(f.type)
    );
    if (files.length > 0) onFiles(multiple ? files : [files[0]]);
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        handleFiles(e.dataTransfer.files);
      }}
      onClick={() => inputRef.current?.click()}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-12 text-center transition-colors",
        dragOver ? "border-primary bg-surface-soft" : "border-hairline hover:bg-surface-soft"
      )}
    >
      <p className="text-sm font-medium text-ink">
        Drop {multiple ? "screenshots" : "a screenshot"} here
      </p>
      <p className="text-xs text-muted">PNG, JPG up to 10MB</p>
      <span className="mt-2 rounded-pill bg-surface-strong px-4 py-1.5 text-sm font-medium text-ink">
        Browse files
      </span>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg"
        multiple={multiple}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}

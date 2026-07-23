"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

const PRESETS = {
  image: { mimeTypes: ["image/png", "image/jpeg"], accept: "image/png,image/jpeg", label: "PNG, JPG up to 10MB" },
  pdf: { mimeTypes: ["application/pdf"], accept: "application/pdf", label: "PDF up to 15MB" },
} as const;

export function Dropzone({
  multiple,
  onFiles,
  kind = "image",
}: {
  multiple: boolean;
  onFiles: (files: File[]) => void;
  kind?: keyof typeof PRESETS;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const preset = PRESETS[kind];

  function handleFiles(fileList: FileList | null) {
    if (!fileList) return;
    const files = Array.from(fileList).filter((f) =>
      (preset.mimeTypes as readonly string[]).includes(f.type)
    );
    if (files.length > 0) onFiles(multiple ? files : [files[0]]);
  }

  const noun = kind === "pdf" ? "a statement" : multiple ? "screenshots" : "a screenshot";

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
        "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-6 sm:p-12 text-center transition-colors",
        dragOver ? "border-primary bg-surface-soft" : "border-hairline hover:bg-surface-soft"
      )}
    >
      <p className="text-sm font-medium text-ink">Drop {noun} here</p>
      <p className="text-xs text-muted">{preset.label}</p>
      <div className="mt-2 flex items-center gap-2">
        <span className="rounded-pill bg-surface-strong px-4 py-1.5 text-sm font-medium text-ink">
          Browse files
        </span>
        {kind === "image" && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              cameraInputRef.current?.click();
            }}
            className="rounded-pill bg-surface-strong px-4 py-1.5 text-sm font-medium text-ink md:hidden"
          >
            Take photo
          </span>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={preset.accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      {kind === "image" && (
        <input
          ref={cameraInputRef}
          type="file"
          accept={preset.accept}
          capture="environment"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      )}
    </div>
  );
}

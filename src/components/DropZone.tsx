import { useRef, useState, type DragEvent } from "react";
import type { TranslateFn } from "../lib/i18n";

type DropZoneProps = {
  onFile: (file: File) => void;
  disabled?: boolean;
  t: TranslateFn;
};

export default function DropZone({ onFile, disabled = false, t }: DropZoneProps) {
  const [isHover, setIsHover] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const pickFile = () => {
    if (!disabled) {
      inputRef.current?.click();
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsHover(false);
    if (disabled) {
      return;
    }
    const file = event.dataTransfer.files?.[0];
    if (file) {
      onFile(file);
    }
  };

  const className = ["drop-zone", isHover ? "is-hover" : "", disabled ? "is-disabled" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={className}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={pickFile}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          pickFile();
        }
      }}
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) {
          setIsHover(true);
        }
      }}
      onDragLeave={() => setIsHover(false)}
      onDrop={handleDrop}
      aria-label={t("dropZoneAria")}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".jsonl,.txt,.log,application/json,text/plain"
        className="hidden-input"
        aria-label={t("pickFileAria")}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            onFile(file);
          }
          event.currentTarget.value = "";
        }}
      />
      <p className="drop-main">{t("dropMain")}</p>
      <p className="drop-sub">{t("dropSub")}</p>
    </div>
  );
}

import { useRef, useState, type DragEvent } from "react";

type DropZoneProps = {
  onFile: (file: File) => void;
  disabled?: boolean;
};

export default function DropZone({ onFile, disabled = false }: DropZoneProps) {
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
      aria-label="上传 JSONL 文件"
    >
      <input
        ref={inputRef}
        type="file"
        accept=".jsonl,.txt,.log,application/json,text/plain"
        className="hidden-input"
        aria-label="选择 JSONL 文件"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            onFile(file);
          }
          event.currentTarget.value = "";
        }}
      />
      <p className="drop-main">拖拽 JSONL 文件到这里</p>
      <p className="drop-sub">或点击选择文件</p>
    </div>
  );
}

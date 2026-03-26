import {
  Archive,
  FileAudio,
  FileCode,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileType,
  FileVideo,
  Folder,
  FolderOpen,
} from "lucide-react";

interface FileIconProps {
  type: "file" | "folder";
  mimeType?: string | null;
  name?: string;
  isOpen?: boolean;
  size?: number;
  className?: string;
}

export function getFileColor(mimeType?: string | null, name?: string): string {
  if (!mimeType && name) {
    const ext = name.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return "oklch(0.65 0.22 25)";
    if (["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(ext ?? "")) return "oklch(0.65 0.22 150)";
    if (["mp4", "mov", "avi", "mkv", "webm"].includes(ext ?? "")) return "oklch(0.65 0.22 290)";
    if (["mp3", "wav", "flac", "aac", "ogg"].includes(ext ?? "")) return "oklch(0.65 0.22 200)";
    if (["zip", "rar", "7z", "tar", "gz"].includes(ext ?? "")) return "oklch(0.65 0.22 60)";
    if (["js", "ts", "jsx", "tsx", "py", "go", "rs", "cpp", "c", "java", "php"].includes(ext ?? "")) return "oklch(0.65 0.22 130)";
    if (["xls", "xlsx", "csv"].includes(ext ?? "")) return "oklch(0.65 0.22 150)";
    if (["doc", "docx"].includes(ext ?? "")) return "oklch(0.65 0.22 220)";
  }
  if (!mimeType) return "oklch(0.60 0.02 270)";
  if (mimeType.startsWith("image/")) return "oklch(0.65 0.22 150)";
  if (mimeType.startsWith("video/")) return "oklch(0.65 0.22 290)";
  if (mimeType.startsWith("audio/")) return "oklch(0.65 0.22 200)";
  if (mimeType === "application/pdf") return "oklch(0.65 0.22 25)";
  if (mimeType.includes("zip") || mimeType.includes("compressed") || mimeType.includes("archive")) return "oklch(0.65 0.22 60)";
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel") || mimeType.includes("csv")) return "oklch(0.65 0.22 150)";
  if (mimeType.includes("word") || mimeType.includes("document")) return "oklch(0.65 0.22 220)";
  if (mimeType.startsWith("text/") || mimeType.includes("javascript") || mimeType.includes("json")) return "oklch(0.65 0.22 130)";
  return "oklch(0.60 0.02 270)";
}

export default function FileIcon({ type, mimeType, name, isOpen, size = 20, className = "" }: FileIconProps) {
  const color = type === "folder" ? "oklch(0.75 0.18 60)" : getFileColor(mimeType, name);
  const iconProps = { size, style: { color }, className };

  if (type === "folder") {
    return isOpen ? <FolderOpen {...iconProps} /> : <Folder {...iconProps} />;
  }

  if (!mimeType && name) {
    const ext = name.split(".").pop()?.toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(ext ?? "")) return <FileImage {...iconProps} />;
    if (["mp4", "mov", "avi", "mkv", "webm"].includes(ext ?? "")) return <FileVideo {...iconProps} />;
    if (["mp3", "wav", "flac", "aac", "ogg"].includes(ext ?? "")) return <FileAudio {...iconProps} />;
    if (["zip", "rar", "7z", "tar", "gz"].includes(ext ?? "")) return <Archive {...iconProps} />;
    if (["js", "ts", "jsx", "tsx", "py", "go", "rs", "cpp", "c", "java", "php"].includes(ext ?? "")) return <FileCode {...iconProps} />;
    if (["xls", "xlsx", "csv"].includes(ext ?? "")) return <FileSpreadsheet {...iconProps} />;
    if (["pdf"].includes(ext ?? "")) return <FileType {...iconProps} />;
  }

  if (mimeType?.startsWith("image/")) return <FileImage {...iconProps} />;
  if (mimeType?.startsWith("video/")) return <FileVideo {...iconProps} />;
  if (mimeType?.startsWith("audio/")) return <FileAudio {...iconProps} />;
  if (mimeType?.includes("zip") || mimeType?.includes("compressed")) return <Archive {...iconProps} />;
  if (mimeType?.includes("spreadsheet") || mimeType?.includes("excel")) return <FileSpreadsheet {...iconProps} />;
  if (mimeType?.startsWith("text/") || mimeType?.includes("javascript")) return <FileCode {...iconProps} />;

  return <FileText {...iconProps} />;
}

export function formatFileSize(bytes?: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} Go`;
}

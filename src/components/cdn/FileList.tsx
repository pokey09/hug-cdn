import { FileItem } from "./FileItem";
import { FolderOpen } from "lucide-react";
import type { UploadedFile } from "@/types/file";

interface FileListProps {
  files: UploadedFile[];
  onDelete: (id: string) => void;
}

export function FileList({ files, onDelete }: FileListProps) {
  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="p-4 rounded-full bg-muted/50 mb-4">
          <FolderOpen className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">No files yet</h3>
        <p className="text-sm text-muted-foreground">
          Upload files to get shareable CDN links
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Your Files</h2>
        <span className="text-sm text-muted-foreground">{files.length} file{files.length !== 1 ? 's' : ''}</span>
      </div>
      {files.map((file) => (
        <FileItem key={file.id} file={file} onDelete={onDelete} />
      ))}
    </div>
  );
}

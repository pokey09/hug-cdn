import { useState, useCallback } from "react";
import type { UploadedFile } from "@/types/file";

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

function generateCdnUrl(fileName: string): string {
  const hash = Math.random().toString(36).substring(2, 10);
  return `https://cdn.example.com/${hash}/${encodeURIComponent(fileName)}`;
}

export function useFileUpload() {
  const [files, setFiles] = useState<UploadedFile[]>([]);

  const uploadFiles = useCallback((newFiles: File[]) => {
    const uploadedFiles: UploadedFile[] = newFiles.map((file) => ({
      id: generateId(),
      name: file.name,
      size: file.size,
      type: file.type || 'application/octet-stream',
      uploadedAt: new Date(),
      cdnUrl: generateCdnUrl(file.name),
      progress: 0,
      status: 'uploading' as const,
    }));

    setFiles((prev) => [...uploadedFiles, ...prev]);

    // Simulate upload progress for each file
    uploadedFiles.forEach((uploadedFile) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 30 + 10;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          setFiles((prev) =>
            prev.map((f) =>
              f.id === uploadedFile.id
                ? { ...f, progress: 100, status: 'complete' as const }
                : f
            )
          );
        } else {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === uploadedFile.id ? { ...f, progress: Math.min(progress, 99) } : f
            )
          );
        }
      }, 200 + Math.random() * 300);
    });
  }, []);

  const deleteFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const totalSize = files.reduce((acc, f) => acc + (f.status === 'complete' ? f.size : 0), 0);
  const completedFiles = files.filter((f) => f.status === 'complete').length;

  return {
    files,
    uploadFiles,
    deleteFile,
    totalSize,
    completedFiles,
  };
}

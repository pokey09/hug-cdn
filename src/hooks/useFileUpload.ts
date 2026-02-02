import { useState, useCallback, useEffect } from "react";
import type { UploadedFile } from "@/types/file";

export interface CdnStats {
  totalFiles: number;
  totalSize: number;
  totalBandwidth: number;
  totalRequests: number;
  uptime: number;
  status: string;
}

export function useFileUpload() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [stats, setStats] = useState<CdnStats>({
    totalFiles: 0,
    totalSize: 0,
    totalBandwidth: 0,
    totalRequests: 0,
    uptime: 0,
    status: 'Active',
  });

  // Load existing files and stats from server on mount
  const refreshData = useCallback(async () => {
    try {
      const [filesRes, statsRes] = await Promise.all([
        fetch('/api/files'),
        fetch('/api/stats'),
      ]);
      if (filesRes.ok) {
        const serverFiles = await filesRes.json();
        setFiles((prev) => {
          // Keep any currently uploading files, replace completed ones with server data
          const uploading = prev.filter((f) => f.status === 'uploading');
          const loaded: UploadedFile[] = serverFiles.map((f: any) => ({
            id: f.id,
            name: f.name,
            size: f.size,
            type: f.type,
            uploadedAt: new Date(f.uploadedAt),
            cdnUrl: f.cdnUrl,
            progress: 100,
            status: 'complete' as const,
          }));
          return [...uploading, ...loaded];
        });
      }
      if (statsRes.ok) {
        setStats(await statsRes.json());
      }
    } catch (err) {
      console.error('Failed to load data from server:', err);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const uploadFiles = useCallback(async (newFiles: File[]) => {
    // Add placeholder entries immediately with uploading status
    const placeholders: UploadedFile[] = newFiles.map((file, i) => ({
      id: `uploading-${Date.now()}-${i}`,
      name: file.name,
      size: file.size,
      type: file.type || 'application/octet-stream',
      uploadedAt: new Date(),
      cdnUrl: '',
      progress: 0,
      status: 'uploading' as const,
    }));

    setFiles((prev) => [...placeholders, ...prev]);

    // Simulate progress while uploading
    const progressIntervals = placeholders.map((ph) => {
      let progress = 0;
      return setInterval(() => {
        progress = Math.min(progress + Math.random() * 15 + 5, 90);
        setFiles((prev) =>
          prev.map((f) =>
            f.id === ph.id ? { ...f, progress: Math.round(progress) } : f
          )
        );
      }, 300);
    });

    try {
      const formData = new FormData();
      newFiles.forEach((file) => formData.append('files', file));

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      // Clear progress intervals
      progressIntervals.forEach(clearInterval);

      if (!res.ok) {
        throw new Error('Upload failed');
      }

      const uploaded = await res.json();

      // Replace placeholders with real data
      setFiles((prev) => {
        const withoutPlaceholders = prev.filter(
          (f) => !placeholders.some((ph) => ph.id === f.id)
        );
        const completed: UploadedFile[] = uploaded.map((f: any) => ({
          id: f.id,
          name: f.name,
          size: f.size,
          type: f.type,
          uploadedAt: new Date(f.uploadedAt),
          cdnUrl: f.cdnUrl,
          progress: 100,
          status: 'complete' as const,
        }));
        return [...completed, ...withoutPlaceholders];
      });

      // Refresh stats
      const statsRes = await fetch('/api/stats');
      if (statsRes.ok) {
        setStats(await statsRes.json());
      }
    } catch (err) {
      console.error('Upload failed:', err);
      progressIntervals.forEach(clearInterval);

      // Mark as error
      setFiles((prev) =>
        prev.map((f) =>
          placeholders.some((ph) => ph.id === f.id)
            ? { ...f, status: 'error' as const, progress: 0 }
            : f
        )
      );
    }
  }, []);

  const deleteFile = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/files/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setFiles((prev) => prev.filter((f) => f.id !== id));
        // Refresh stats
        const statsRes = await fetch('/api/stats');
        if (statsRes.ok) {
          setStats(await statsRes.json());
        }
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
  }, []);

  const totalSize = stats.totalSize;
  const completedFiles = stats.totalFiles;

  return {
    files,
    uploadFiles,
    deleteFile,
    totalSize,
    completedFiles,
    stats,
    refreshStats: refreshData,
  };
}

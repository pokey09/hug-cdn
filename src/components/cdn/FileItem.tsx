import { useState } from "react";
import { File, Image, Film, Music, FileText, Archive, Copy, Check, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { UploadedFile } from "@/types/file";

interface FileItemProps {
  file: UploadedFile;
  onDelete: (id: string) => void;
}

function getFileIcon(type: string) {
  if (type.startsWith('image/')) return Image;
  if (type.startsWith('video/')) return Film;
  if (type.startsWith('audio/')) return Music;
  if (type.startsWith('text/') || type.includes('document')) return FileText;
  if (type.includes('zip') || type.includes('rar') || type.includes('tar')) return Archive;
  return File;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

export function FileItem({ file, onDelete }: FileItemProps) {
  const [copied, setCopied] = useState(false);
  const Icon = getFileIcon(file.type);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(file.cdnUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn(
      "glass rounded-lg p-4 transition-all duration-200",
      "hover:bg-card/70 group",
      file.status === 'uploading' && "animate-pulse"
    )}>
      <div className="flex items-center gap-4">
        {/* File Icon */}
        <div className={cn(
          "p-3 rounded-lg shrink-0",
          file.status === 'complete' ? "bg-primary/10" : "bg-muted"
        )}>
          <Icon className={cn(
            "w-5 h-5",
            file.status === 'complete' ? "text-primary" : "text-muted-foreground"
          )} />
        </div>

        {/* File Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-foreground truncate">{file.name}</p>
            {file.status === 'complete' && (
              <span className="shrink-0 px-2 py-0.5 text-xs rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                Live
              </span>
            )}
          </div>
          
          {file.status === 'uploading' ? (
            <div className="mt-2">
              <Progress value={file.progress} className="h-1.5" />
              <p className="text-xs text-muted-foreground mt-1">
                Uploading... {file.progress}%
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-3 mt-1">
              <p className="text-sm text-muted-foreground">{formatFileSize(file.size)}</p>
              <span className="text-muted-foreground/40">•</span>
              <p className="text-sm text-muted-foreground">{formatDate(file.uploadedAt)}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        {file.status === 'complete' && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              onClick={copyToClipboard}
              className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
            >
              <a href={file.cdnUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4" />
              </a>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(file.id)}
              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* CDN URL */}
      {file.status === 'complete' && (
        <div 
          onClick={copyToClipboard}
          className="mt-3 px-3 py-2 rounded-md bg-muted/50 cursor-pointer hover:bg-muted transition-colors group/url"
        >
          <code className="text-xs text-muted-foreground break-all group-hover/url:text-primary transition-colors">
            {file.cdnUrl}
          </code>
        </div>
      )}
    </div>
  );
}

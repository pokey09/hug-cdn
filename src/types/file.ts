export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: Date;
  cdnUrl: string;
  progress: number;
  status: 'uploading' | 'complete' | 'error';
}

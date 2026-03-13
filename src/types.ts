export interface CompressedFile {
  id: string;
  originalFile: File;
  compressedFile: File | null;
  status: 'pending' | 'compressing' | 'success' | 'error';
  originalSize: number;
  compressedSize: number;
  savings: number;
  error?: string;
}

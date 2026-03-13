import React, { useCallback, useState } from 'react';
import { UploadCloud } from 'lucide-react';

interface DropzoneProps {
  onFilesAdded: (files: File[]) => void;
}

export function Dropzone({ onFilesAdded }: DropzoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const files = Array.from(e.dataTransfer.files).filter((file: File) =>
          file.type.startsWith('image/')
        );
        if (files.length > 0) {
          onFilesAdded(files);
        }
      }
    },
    [onFilesAdded]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        const files = Array.from(e.target.files).filter((file: File) =>
          file.type.startsWith('image/')
        );
        if (files.length > 0) {
          onFilesAdded(files);
        }
      }
    },
    [onFilesAdded]
  );

  return (
    <div
      className={`relative flex flex-col items-center justify-center w-full max-w-3xl p-12 mx-auto mt-8 border-4 border-dashed rounded-3xl transition-colors duration-300 ease-in-out cursor-pointer ${
        isDragActive
          ? 'border-emerald-500 bg-emerald-50/50'
          : 'border-slate-300 bg-white hover:border-emerald-400 hover:bg-slate-50'
      }`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={() => document.getElementById('file-upload')?.click()}
    >
      <input
        id="file-upload"
        type="file"
        multiple
        accept="image/png, image/jpeg, image/webp"
        className="hidden"
        onChange={handleFileInput}
      />
      <div className="flex flex-col items-center justify-center space-y-4 text-center">
        <div className={`p-4 rounded-full ${isDragActive ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
          <UploadCloud className="w-12 h-12" />
        </div>
        <div>
          <p className="text-xl font-semibold text-slate-700">
            将您的 WebP、PNG 或 JPEG 文件拖放到此处！
          </p>
          <p className="mt-2 text-sm text-slate-500">
            最多 20 张图片，每张最大 5 MB。
          </p>
        </div>
      </div>
    </div>
  );
}

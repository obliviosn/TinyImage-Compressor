import React from 'react';
import { CompressedFile } from '../types';
import { FileItem } from './FileItem';
import { DownloadCloud } from 'lucide-react';
import { formatBytes } from '../utils/format';

interface FileListProps {
  files: CompressedFile[];
  onDownload: (id: string) => void;
  onDownloadAll: () => void;
}

export function FileList({ files, onDownload, onDownloadAll }: FileListProps) {
  if (files.length === 0) return null;

  const totalOriginalSize = files.reduce((acc, file) => acc + file.originalSize, 0);
  const totalCompressedSize = files.reduce(
    (acc, file) => acc + (file.compressedSize || file.originalSize),
    0
  );
  const totalSavings = totalOriginalSize - totalCompressedSize;
  const savingsPercentage =
    totalOriginalSize > 0 ? (totalSavings / totalOriginalSize) * 100 : 0;

  const allSuccess = files.every((f) => f.status === 'success' || f.status === 'error');
  const hasSuccess = files.some((f) => f.status === 'success');

  return (
    <div className="w-full max-w-3xl mx-auto mt-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-800">您的文件</h2>
        {allSuccess && hasSuccess && (
          <button
            onClick={onDownloadAll}
            className="flex items-center px-6 py-3 text-sm font-semibold text-white transition-colors bg-emerald-500 rounded-full hover:bg-emerald-600 shadow-sm hover:shadow-md"
          >
            <DownloadCloud className="w-5 h-5 mr-2" />
            全部下载
          </button>
        )}
      </div>

      <div className="space-y-4">
        {files.map((file) => (
          <FileItem key={file.id} file={file} onDownload={onDownload} />
        ))}
      </div>

      {allSuccess && hasSuccess && (
        <div className="p-6 mt-8 bg-emerald-50 border border-emerald-100 rounded-3xl text-center">
          <p className="text-lg font-medium text-emerald-800">
            熊猫为您节省了{' '}
            <span className="font-bold text-emerald-600">
              {formatBytes(totalSavings)}
            </span>{' '}
            ({savingsPercentage.toFixed(0)}%)!
          </p>
        </div>
      )}
    </div>
  );
}

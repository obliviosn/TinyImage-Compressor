import React, { useEffect, useState } from 'react';
import { CompressedFile } from '../types';
import { formatBytes } from '../utils/format';
import { CheckCircle2, Loader2, AlertCircle, Download } from 'lucide-react';

interface FileItemProps {
  file: CompressedFile;
  onDownload: (id: string) => void;
}

export function FileItem({ file, onDownload }: FileItemProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (file.originalFile) {
      const url = URL.createObjectURL(file.originalFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file.originalFile]);

  const isSuccess = file.status === 'success';
  const isCompressing = file.status === 'compressing';
  const isError = file.status === 'error';

  return (
    <div className="flex items-center justify-between p-4 mb-3 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center flex-1 space-x-4 overflow-hidden">
        <div className="flex-shrink-0 w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt={file.originalFile.name}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="w-full h-full bg-slate-200" />
          )}
        </div>
        <div className="flex flex-col flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-900 truncate">
            {file.originalFile.name}
          </p>
          <div className="flex items-center mt-1 text-xs text-slate-500 space-x-2">
            <span>{formatBytes(file.originalSize)}</span>
            {isSuccess && (
              <>
                <span>→</span>
                <span className="font-medium text-emerald-600">
                  {formatBytes(file.compressedSize)}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end flex-shrink-0 ml-4 space-x-4 w-48">
        {isCompressing && (
          <div className="flex items-center text-slate-500 text-sm">
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            压缩中...
          </div>
        )}

        {isError && (
          <div className="flex items-center text-red-500 text-sm">
            <AlertCircle className="w-4 h-4 mr-1" />
            <span className="truncate max-w-[100px]">{file.error || '错误'}</span>
          </div>
        )}

        {isSuccess && (
          <>
            <div className="flex flex-col items-end">
              <span className="text-sm font-bold text-emerald-600">
                -{file.savings.toFixed(0)}%
              </span>
              <div className="w-16 h-1.5 mt-1 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${file.savings}%` }}
                />
              </div>
            </div>
            <button
              onClick={() => onDownload(file.id)}
              className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors"
              title="Download"
            >
              <Download className="w-5 h-5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

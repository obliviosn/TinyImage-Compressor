import React, { useState, useCallback } from 'react';
import imageCompression from 'browser-image-compression';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Dropzone } from './Dropzone';
import { FileList } from './FileList';
import { CompressedFile } from '../types';
import { Leaf } from 'lucide-react';

export function ImageCompressor() {
  const [files, setFiles] = useState<CompressedFile[]>([]);

  const compressFile = async (file: File, id: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, status: 'compressing' } : f))
    );

    const options = {
      maxSizeMB: 5,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      initialQuality: 0.8,
    };

    try {
      const compressedFile = await imageCompression(file, options);
      const savings =
        ((file.size - compressedFile.size) / file.size) * 100;

      setFiles((prev) =>
        prev.map((f) =>
          f.id === id
            ? {
                ...f,
                compressedFile,
                compressedSize: compressedFile.size,
                savings: savings > 0 ? savings : 0,
                status: 'success',
              }
            : f
        )
      );
    } catch (error) {
      console.error('Compression error:', error);
      setFiles((prev) =>
        prev.map((f) =>
          f.id === id
            ? { ...f, status: 'error', error: 'Compression failed' }
            : f
        )
      );
    }
  };

  const handleFilesAdded = useCallback((newFiles: File[]) => {
    const newCompressedFiles: CompressedFile[] = newFiles.map((file) => ({
      id: Math.random().toString(36).substring(7),
      originalFile: file,
      compressedFile: null,
      status: 'pending',
      originalSize: file.size,
      compressedSize: 0,
      savings: 0,
    }));

    setFiles((prev) => [...prev, ...newCompressedFiles]);

    newCompressedFiles.forEach((f) => {
      compressFile(f.originalFile, f.id);
    });
  }, []);

  const handleDownload = useCallback(
    (id: string) => {
      const file = files.find((f) => f.id === id);
      if (file && file.compressedFile) {
        saveAs(file.compressedFile, file.originalFile.name);
      }
    },
    [files]
  );

  const handleDownloadAll = useCallback(async () => {
    const successFiles = files.filter((f) => f.status === 'success' && f.compressedFile);
    if (successFiles.length === 0) return;

    const zip = new JSZip();
    successFiles.forEach((f) => {
      if (f.compressedFile) {
        zip.file(f.originalFile.name, f.compressedFile);
      }
    });

    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, 'tinypng-compressed.zip');
  }, [files]);

  return (
    <>
      {/* Header / Hero */}
      <header className="relative overflow-hidden bg-gradient-to-b from-emerald-500 to-emerald-600 pb-32 pt-16 text-center text-white">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
        <div className="relative z-10 max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-center mb-6 space-x-3">
            <div className="p-3 bg-white rounded-2xl shadow-lg">
              <Leaf className="w-10 h-10 text-emerald-500" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
              TinyImage
            </h1>
          </div>
          <p className="max-w-2xl mx-auto text-xl font-medium text-emerald-50 sm:text-2xl">
            Smart WebP, PNG and JPEG compression
          </p>
          <p className="mt-4 text-emerald-100 max-w-xl mx-auto">
            More than 1 billion WebP, PNG and JPEG images compressed and still counting!
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-20 px-4 pb-24 -mt-24">
        <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl p-8 sm:p-12">
          <Dropzone onFilesAdded={handleFilesAdded} />
          <FileList
            files={files}
            onDownload={handleDownload}
            onDownloadAll={handleDownloadAll}
          />
        </div>
      </main>
    </>
  );
}

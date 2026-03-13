import React, { useState, useCallback } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import heic2any from 'heic2any';
import { Dropzone } from './Dropzone';
import { Settings, DownloadCloud, Loader2, AlertCircle, Download, ArrowRight } from 'lucide-react';
import { formatBytes } from '../utils/format';

interface ConvertedFile {
  id: string;
  originalFile: File;
  convertedBlob: Blob | null;
  status: 'pending' | 'converting' | 'success' | 'error';
  targetFormat: string;
  error?: string;
}

const SUPPORTED_FORMATS = [
  { value: 'image/jpeg', label: 'JPEG' },
  { value: 'image/png', label: 'PNG' },
  { value: 'image/webp', label: 'WebP' },
  { value: 'image/bmp', label: 'BMP' },
  { value: 'image/gif', label: 'GIF' },
  { value: 'image/x-icon', label: 'ICO' },
];

const convertToBmp = (canvas: HTMLCanvasElement): Blob => {
  const width = canvas.width;
  const height = canvas.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('无法获取 canvas 上下文');
  
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  const rowSize = Math.floor((24 * width + 31) / 32) * 4;
  const pixelArraySize = rowSize * height;
  const fileSize = 54 + pixelArraySize;
  
  const buffer = new ArrayBuffer(fileSize);
  const view = new DataView(buffer);
  
  // BMP Header
  view.setUint8(0, 0x42); // 'B'
  view.setUint8(1, 0x4D); // 'M'
  view.setUint32(2, fileSize, true);
  view.setUint32(6, 0, true);
  view.setUint32(10, 54, true); // Offset
  
  // DIB Header
  view.setUint32(14, 40, true); // Header size
  view.setUint32(18, width, true);
  view.setInt32(22, -height, true); // Top-down
  view.setUint16(26, 1, true); // Planes
  view.setUint16(28, 24, true); // BPP
  view.setUint32(30, 0, true); // Compression
  view.setUint32(34, pixelArraySize, true);
  view.setUint32(38, 2835, true);
  view.setUint32(42, 2835, true);
  view.setUint32(46, 0, true);
  view.setUint32(50, 0, true);
  
  let offset = 54;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      view.setUint8(offset + x * 3, data[i + 2]);     // B
      view.setUint8(offset + x * 3 + 1, data[i + 1]); // G
      view.setUint8(offset + x * 3 + 2, data[i]);     // R
    }
    offset += rowSize;
  }
  
  return new Blob([buffer], { type: 'image/bmp' });
};

const convertToIco = async (canvas: HTMLCanvasElement): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const size = Math.min(canvas.width, canvas.height, 256);
    const icoCanvas = document.createElement('canvas');
    icoCanvas.width = size;
    icoCanvas.height = size;
    const ctx = icoCanvas.getContext('2d');
    if (!ctx) return reject(new Error('无法获取 canvas 上下文'));
    
    ctx.drawImage(canvas, 0, 0, size, size);
    
    icoCanvas.toBlob(async (pngBlob) => {
      if (!pngBlob) return reject(new Error('PNG 转换失败'));
      const pngBuffer = await pngBlob.arrayBuffer();
      const pngUint8 = new Uint8Array(pngBuffer);
      const header = new ArrayBuffer(22);
      const view = new DataView(header);
      
      view.setUint16(0, 0, true);
      view.setUint16(2, 1, true);
      view.setUint16(4, 1, true);
      
      view.setUint8(6, size === 256 ? 0 : size);
      view.setUint8(7, size === 256 ? 0 : size);
      view.setUint8(8, 0);
      view.setUint8(9, 0);
      view.setUint16(10, 1, true);
      view.setUint16(12, 32, true);
      view.setUint32(14, pngUint8.length, true);
      view.setUint32(18, 22, true);
      
      resolve(new Blob([header, pngUint8], { type: 'image/x-icon' }));
    }, 'image/png');
  });
};

export function FormatConverter() {
  const [files, setFiles] = useState<ConvertedFile[]>([]);
  const [globalTargetFormat, setGlobalTargetFormat] = useState('image/webp');

  const convertImage = async (file: File, targetFormat: string): Promise<Blob> => {
    let fileToProcess: Blob = file;
    const fileName = file.name.toLowerCase();
    
    if (fileName.endsWith('.heic') || fileName.endsWith('.heif')) {
      try {
        const convertedBlob = await heic2any({
          blob: file,
          toType: 'image/png',
        });
        fileToProcess = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
      } catch (e) {
        throw new Error('HEIC 转换失败，请确保文件未损坏');
      }
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(fileToProcess);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('无法获取 canvas 上下文'));
        }
        
        // Fill background with white for JPEG/BMP conversion from transparent PNG/WebP
        if (targetFormat === 'image/jpeg' || targetFormat === 'image/bmp') {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        ctx.drawImage(img, 0, 0);
        
        if (targetFormat === 'image/bmp') {
          try {
            resolve(convertToBmp(canvas));
          } catch (e) {
            reject(e);
          }
          return;
        }
        
        if (targetFormat === 'image/x-icon') {
          convertToIco(canvas).then(resolve).catch(reject);
          return;
        }
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('转换失败'));
            }
          },
          targetFormat,
          0.9 // High quality
        );
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('无法加载图片'));
      };
      
      img.src = url;
    });
  };

  const processFile = async (id: string, file: File, format: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, status: 'converting', targetFormat: format } : f))
    );

    try {
      const convertedBlob = await convertImage(file, format);
      setFiles((prev) =>
        prev.map((f) =>
          f.id === id
            ? {
                ...f,
                convertedBlob,
                status: 'success',
              }
            : f
        )
      );
    } catch (error) {
      console.error('Conversion error:', error);
      setFiles((prev) =>
        prev.map((f) =>
          f.id === id
            ? { ...f, status: 'error', error: error instanceof Error ? error.message : '转换失败' }
            : f
        )
      );
    }
  };

  const handleFilesAdded = useCallback((newFiles: File[]) => {
    const newConvertedFiles: ConvertedFile[] = newFiles.map((file) => ({
      id: Math.random().toString(36).substring(7),
      originalFile: file,
      convertedBlob: null,
      status: 'pending',
      targetFormat: globalTargetFormat,
    }));

    setFiles((prev) => [...prev, ...newConvertedFiles]);

    newConvertedFiles.forEach((f) => {
      processFile(f.id, f.originalFile, f.targetFormat);
    });
  }, [globalTargetFormat]);

  const handleFormatChange = (id: string, newFormat: string) => {
    const fileToConvert = files.find((f) => f.id === id);
    if (fileToConvert) {
      processFile(id, fileToConvert.originalFile, newFormat);
    }
  };

  const handleGlobalFormatChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newFormat = e.target.value;
    setGlobalTargetFormat(newFormat);
    
    // Convert all existing files to the new format
    files.forEach((f) => {
      processFile(f.id, f.originalFile, newFormat);
    });
  };

  const getExtension = (mimeType: string) => {
    switch (mimeType) {
      case 'image/jpeg': return '.jpg';
      case 'image/png': return '.png';
      case 'image/webp': return '.webp';
      case 'image/bmp': return '.bmp';
      case 'image/gif': return '.gif';
      case 'image/x-icon': return '.ico';
      default: return '.img';
    }
  };

  const handleDownload = useCallback((id: string) => {
    const file = files.find((f) => f.id === id);
    if (file && file.convertedBlob) {
      const originalNameWithoutExt = file.originalFile.name.replace(/\.[^/.]+$/, "");
      const newName = `${originalNameWithoutExt}${getExtension(file.targetFormat)}`;
      saveAs(file.convertedBlob, newName);
    }
  }, [files]);

  const handleDownloadAll = useCallback(async () => {
    const successFiles = files.filter((f) => f.status === 'success' && f.convertedBlob);
    if (successFiles.length === 0) return;

    const zip = new JSZip();
    successFiles.forEach((f) => {
      if (f.convertedBlob) {
        const originalNameWithoutExt = f.originalFile.name.replace(/\.[^/.]+$/, "");
        const newName = `${originalNameWithoutExt}${getExtension(f.targetFormat)}`;
        zip.file(newName, f.convertedBlob);
      }
    });

    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, 'converted-images.zip');
  }, [files]);

  const allSuccess = files.length > 0 && files.every((f) => f.status === 'success' || f.status === 'error');
  const hasSuccess = files.some((f) => f.status === 'success');

  return (
    <>
      {/* Header / Hero */}
      <header className="relative overflow-hidden bg-gradient-to-b from-indigo-500 to-indigo-600 pb-32 pt-16 text-center text-white">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
        <div className="relative z-10 max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-center mb-6 space-x-3">
            <div className="p-3 bg-white rounded-2xl shadow-lg">
              <Settings className="w-10 h-10 text-indigo-500" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
              图片格式转换
            </h1>
          </div>
          <p className="max-w-2xl mx-auto text-xl font-medium text-indigo-50 sm:text-2xl">
            在 WebP、PNG、JPEG 等格式之间自由转换
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-20 px-4 pb-24 -mt-24">
        <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl p-8 sm:p-12">
          
          <div className="mb-6 flex flex-col sm:flex-row items-center justify-between bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
            <div className="mb-4 sm:mb-0">
              <h3 className="text-lg font-semibold text-indigo-900">全局转换设置</h3>
              <p className="text-sm text-indigo-700">选择您希望将图片转换成的目标格式</p>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-indigo-800">转换为:</span>
              <select
                value={globalTargetFormat}
                onChange={handleGlobalFormatChange}
                className="block w-32 pl-3 pr-10 py-2 text-base border-indigo-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-xl bg-white shadow-sm"
              >
                {SUPPORTED_FORMATS.map(fmt => (
                  <option key={fmt.value} value={fmt.value}>{fmt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <Dropzone 
            onFilesAdded={handleFilesAdded} 
            accept="image/*"
            title="将您的图片文件拖放到此处！"
            subtitle="支持任意图片格式，批量转换。"
            colorTheme="indigo"
          />

          {files.length > 0 && (
            <div className="w-full max-w-3xl mx-auto mt-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-800">您的文件</h2>
                {allSuccess && hasSuccess && (
                  <button
                    onClick={handleDownloadAll}
                    className="flex items-center px-6 py-3 text-sm font-semibold text-white transition-colors bg-indigo-500 rounded-full hover:bg-indigo-600 shadow-sm hover:shadow-md"
                  >
                    <DownloadCloud className="w-5 h-5 mr-2" />
                    全部下载
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {files.map((file) => {
                  const isSuccess = file.status === 'success';
                  const isConverting = file.status === 'converting';
                  const isError = file.status === 'error';

                  return (
                    <div key={file.id} className="flex items-center justify-between p-4 mb-3 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center flex-1 space-x-4 overflow-hidden">
                        <div className="flex flex-col flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {file.originalFile.name}
                          </p>
                          <div className="flex items-center mt-1 text-xs text-slate-500 space-x-2">
                            <span>{formatBytes(file.originalFile.size)}</span>
                            {isSuccess && file.convertedBlob && (
                              <>
                                <ArrowRight className="w-3 h-3 text-slate-400" />
                                <span className="font-medium text-indigo-600">
                                  {formatBytes(file.convertedBlob.size)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-end flex-shrink-0 ml-4 space-x-4">
                        <select
                          value={file.targetFormat}
                          onChange={(e) => handleFormatChange(file.id, e.target.value)}
                          disabled={isConverting}
                          className="block w-24 pl-2 pr-8 py-1.5 text-xs border-slate-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-lg bg-slate-50"
                        >
                          {SUPPORTED_FORMATS.map(fmt => (
                            <option key={fmt.value} value={fmt.value}>{fmt.label}</option>
                          ))}
                        </select>

                        <div className="w-24 flex justify-end">
                          {isConverting && (
                            <div className="flex items-center text-slate-500 text-sm">
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              转换中...
                            </div>
                          )}

                          {isError && (
                            <div className="flex items-center text-red-500 text-sm">
                              <AlertCircle className="w-4 h-4 mr-1" />
                              <span className="truncate max-w-[80px]">{file.error || '错误'}</span>
                            </div>
                          )}

                          {isSuccess && (
                            <button
                              onClick={() => handleDownload(file.id)}
                              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                              title="下载"
                            >
                              <Download className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

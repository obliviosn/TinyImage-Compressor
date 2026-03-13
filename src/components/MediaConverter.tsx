import React, { useState, useCallback, useRef, useEffect } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import workerURL from '../ffmpeg-worker?worker&url';
import coreURL from '@ffmpeg/core?url';
import wasmURL from '@ffmpeg/core/wasm?url';
import { Dropzone } from './Dropzone';
import { Settings, DownloadCloud, Loader2, AlertCircle, Download, ArrowRight, Music, Clock, HardDrive, Film } from 'lucide-react';
import { formatBytes } from '../utils/format';

const getMediaDuration = (file: File): Promise<number> => {
  return new Promise((resolve) => {
    const isVideo = file.type.startsWith('video/');
    const media = isVideo ? document.createElement('video') : new Audio();
    const objectUrl = URL.createObjectURL(file);
    media.addEventListener('loadedmetadata', () => {
      resolve(media.duration);
      URL.revokeObjectURL(objectUrl);
    });
    media.addEventListener('error', () => {
      resolve(0);
      URL.revokeObjectURL(objectUrl);
    });
    media.src = objectUrl;
  });
};

const formatDuration = (seconds: number) => {
  if (!seconds || !isFinite(seconds)) return '';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

interface ConvertedAudio {
  id: string;
  originalFile: File;
  convertedBlob: Blob | null;
  status: 'pending' | 'converting' | 'success' | 'error';
  targetFormat: string;
  error?: string;
  duration?: number;
}

const SUPPORTED_FORMATS = [
  // Audio
  { value: 'mp3', label: 'MP3', type: 'audio' },
  { value: 'wav', label: 'WAV', type: 'audio' },
  { value: 'ogg', label: 'OGG', type: 'audio' },
  { value: 'aac', label: 'AAC', type: 'audio' },
  { value: 'flac', label: 'FLAC', type: 'audio' },
  { value: 'm4a', label: 'M4A', type: 'audio' },
  // Video
  { value: 'mp4', label: 'MP4', type: 'video' },
  { value: 'webm', label: 'WEBM', type: 'video' },
  { value: 'avi', label: 'AVI', type: 'video' },
  { value: 'mov', label: 'MOV', type: 'video' },
  { value: 'mkv', label: 'MKV', type: 'video' },
];

export function MediaConverter() {
  const [files, setFiles] = useState<ConvertedAudio[]>([]);
  const [globalTargetFormat, setGlobalTargetFormat] = useState('mp3');
  const [isReady, setIsReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const ffmpegRef = useRef(new FFmpeg());
  const isInitializingRef = useRef(false);

  const loadFFmpeg = async () => {
    if (isReady || isInitializingRef.current) return;
    isInitializingRef.current = true;
    setLoadError(null);
    try {
      const ffmpeg = ffmpegRef.current;
      ffmpeg.on('log', ({ message }) => {
        console.log(message);
      });
      
      await ffmpeg.load({
        coreURL,
        wasmURL,
        classWorkerURL: workerURL,
      });
      
      setIsReady(true);
    } catch (e) {
      console.error('FFmpeg load failed', e);
      setLoadError('音频转换引擎加载失败，请检查网络或刷新重试。');
    } finally {
      isInitializingRef.current = false;
    }
  };

  useEffect(() => {
    loadFFmpeg();
  }, []);

  const convertAudio = async (file: File, targetFormat: string): Promise<Blob> => {
    if (!isReady) throw new Error('转换引擎未就绪');
    
    const ffmpeg = ffmpegRef.current;
    
    // Sanitize filename for ffmpeg
    const safeName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const inputName = `input_${Date.now()}_${safeName}`;
    const outputName = `output_${Date.now()}.${targetFormat}`;
    
    await ffmpeg.writeFile(inputName, await fetchFile(file));
    
    // Run FFmpeg command
    await ffmpeg.exec(['-i', inputName, '-y', outputName]);
    
    const data = await ffmpeg.readFile(outputName);
    
    // Clean up
    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);
    
    // Determine mime type
    let mimeType = '';
    const formatInfo = SUPPORTED_FORMATS.find(f => f.value === targetFormat);
    if (formatInfo?.type === 'video') {
      mimeType = `video/${targetFormat}`;
      if (targetFormat === 'mkv') mimeType = 'video/x-matroska';
    } else {
      mimeType = `audio/${targetFormat}`;
      if (targetFormat === 'mp3') mimeType = 'audio/mpeg';
      if (targetFormat === 'm4a') mimeType = 'audio/mp4';
    }
    
    return new Blob([data], { type: mimeType });
  };

  const processFile = async (id: string, file: File, format: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, status: 'converting', targetFormat: format } : f))
    );

    try {
      const convertedBlob = await convertAudio(file, format);
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

  const handleFilesAdded = async (newFiles: File[]) => {
    const newConvertedFiles: ConvertedAudio[] = await Promise.all(
      newFiles.map(async (file) => {
        let duration = 0;
        try {
          duration = await getMediaDuration(file);
        } catch (e) {
          console.error("Failed to get duration", e);
        }
        return {
          id: Math.random().toString(36).substring(7),
          originalFile: file,
          convertedBlob: null,
          status: 'pending',
          targetFormat: globalTargetFormat,
          duration,
        };
      })
    );

    setFiles((prev) => [...prev, ...newConvertedFiles]);

    if (!isReady) {
      alert('转换引擎正在初始化，请稍后重试。');
      return;
    }

    newConvertedFiles.forEach((f) => {
      processFile(f.id, f.originalFile, f.targetFormat);
    });
  };

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

  const handleDownload = (id: string) => {
    const file = files.find((f) => f.id === id);
    if (file && file.convertedBlob) {
      const originalNameWithoutExt = file.originalFile.name.replace(/\.[^/.]+$/, "");
      const newName = `${originalNameWithoutExt}.${file.targetFormat}`;
      saveAs(file.convertedBlob, newName);
    }
  };

  const handleDownloadAll = async () => {
    const successFiles = files.filter((f) => f.status === 'success' && f.convertedBlob);
    if (successFiles.length === 0) return;

    const zip = new JSZip();
    successFiles.forEach((f) => {
      if (f.convertedBlob) {
        const originalNameWithoutExt = f.originalFile.name.replace(/\.[^/.]+$/, "");
        const newName = `${originalNameWithoutExt}.${f.targetFormat}`;
        zip.file(newName, f.convertedBlob);
      }
    });

    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, 'converted-audio.zip');
  };

  const allSuccess = files.length > 0 && files.every((f) => f.status === 'success' || f.status === 'error');
  const hasSuccess = files.some((f) => f.status === 'success');

  return (
    <>
      {/* Header / Hero */}
      <header className="relative overflow-hidden bg-gradient-to-b from-rose-500 to-rose-600 pb-32 pt-16 text-center text-white">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
        <div className="relative z-10 max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-center mb-6 space-x-3">
            <div className="p-3 bg-white rounded-2xl shadow-lg">
              <Film className="w-10 h-10 text-rose-500" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
              多媒体格式转换
            </h1>
          </div>
          <p className="max-w-2xl mx-auto text-xl font-medium text-rose-50 sm:text-2xl">
            支持 MP4、WEBM、MP3、WAV 等所有主流音视频格式互相转换
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-20 px-4 pb-24 -mt-24">
        <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl p-8 sm:p-12">
          
          <div className="mb-6 flex flex-col sm:flex-row items-center justify-between bg-rose-50 p-4 rounded-2xl border border-rose-100">
            <div className="mb-4 sm:mb-0">
              <h3 className="text-lg font-semibold text-rose-900">全局转换设置</h3>
              <p className="text-sm text-rose-700">选择您希望将文件转换成的目标格式</p>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-rose-800">转换为:</span>
              <select
                value={globalTargetFormat}
                onChange={handleGlobalFormatChange}
                className="block w-32 pl-3 pr-10 py-2 text-base border-rose-300 focus:outline-none focus:ring-rose-500 focus:border-rose-500 sm:text-sm rounded-xl bg-white shadow-sm"
              >
                <optgroup label="视频格式">
                  {SUPPORTED_FORMATS.filter(f => f.type === 'video').map(fmt => (
                    <option key={fmt.value} value={fmt.value}>{fmt.label}</option>
                  ))}
                </optgroup>
                <optgroup label="音频格式">
                  {SUPPORTED_FORMATS.filter(f => f.type === 'audio').map(fmt => (
                    <option key={fmt.value} value={fmt.value}>{fmt.label}</option>
                  ))}
                </optgroup>
              </select>
            </div>
          </div>

          <Dropzone 
            onFilesAdded={handleFilesAdded} 
            accept="audio/*,video/*"
            title="将您的音视频文件拖放到此处！"
            subtitle="支持 MP4, WEBM, MP3, WAV, FLAC 等任意格式，批量转换。"
            colorTheme="rose"
          />

          {!isReady && !loadError && (
            <div className="mt-6 text-center text-slate-500 flex items-center justify-center">
              <Loader2 className="w-5 h-5 mr-2 animate-spin text-rose-500" />
              正在加载多媒体转换引擎 (FFmpeg)...
            </div>
          )}

          {loadError && (
            <div className="mt-6 text-center text-red-500 flex flex-col items-center justify-center p-4 bg-red-50 rounded-xl border border-red-100">
              <div className="flex items-center mb-2">
                <AlertCircle className="w-5 h-5 mr-2" />
                <span className="font-medium">{loadError}</span>
              </div>
              <button 
                onClick={loadFFmpeg}
                className="mt-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium transition-colors"
              >
                重试加载
              </button>
            </div>
          )}

          {files.length > 0 && (
            <div className="w-full max-w-3xl mx-auto mt-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-800">您的文件</h2>
                {allSuccess && hasSuccess && (
                  <button
                    onClick={handleDownloadAll}
                    className="flex items-center px-6 py-3 text-sm font-semibold text-white transition-colors bg-rose-500 rounded-full hover:bg-rose-600 shadow-sm hover:shadow-md"
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
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium text-slate-900 truncate">
                              {file.originalFile.name}
                            </p>
                            <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider text-slate-500 bg-slate-100 rounded-md uppercase flex-shrink-0">
                              {file.originalFile.name.split('.').pop()}
                            </span>
                          </div>
                          <div className="flex items-center mt-1.5 text-xs text-slate-500 space-x-3">
                            <span className="flex items-center">
                              <HardDrive className="w-3 h-3 mr-1" />
                              {formatBytes(file.originalFile.size)}
                            </span>
                            {file.duration ? (
                              <span className="flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {formatDuration(file.duration)}
                              </span>
                            ) : null}
                            {isSuccess && file.convertedBlob && (
                              <>
                                <ArrowRight className="w-3 h-3 text-slate-400" />
                                <span className="flex items-center font-medium text-rose-600">
                                  <HardDrive className="w-3 h-3 mr-1" />
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
                          className="block w-24 pl-2 pr-8 py-1.5 text-xs border-slate-300 focus:outline-none focus:ring-rose-500 focus:border-rose-500 rounded-lg bg-slate-50"
                        >
                          <optgroup label="视频格式">
                            {SUPPORTED_FORMATS.filter(f => f.type === 'video').map(fmt => (
                              <option key={fmt.value} value={fmt.value}>{fmt.label}</option>
                            ))}
                          </optgroup>
                          <optgroup label="音频格式">
                            {SUPPORTED_FORMATS.filter(f => f.type === 'audio').map(fmt => (
                              <option key={fmt.value} value={fmt.value}>{fmt.label}</option>
                            ))}
                          </optgroup>
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
                              <span className="truncate max-w-[80px]" title={file.error}>{file.error || '错误'}</span>
                            </div>
                          )}

                          {isSuccess && (
                            <button
                              onClick={() => handleDownload(file.id)}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors"
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

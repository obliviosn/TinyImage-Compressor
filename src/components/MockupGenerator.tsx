import React, { useState, useRef, useCallback } from 'react';
import { toPng } from 'html-to-image';
import { saveAs } from 'file-saver';
import { Upload, Download, Monitor, Smartphone, Layout } from 'lucide-react';

type DeviceCategory = 'browser' | 'mobile';
type BrowserType = 'mac' | 'windows' | 'linux';
type MobileType = 'iphone' | 'ipad' | 'macos';
type Padding = 'sm' | 'md' | 'lg';

export function MockupGenerator() {
  const [image, setImage] = useState<string | null>(null);
  const [deviceCategory, setDeviceCategory] = useState<DeviceCategory>('browser');
  const [browserType, setBrowserType] = useState<BrowserType>('mac');
  const [mobileType, setMobileType] = useState<MobileType>('iphone');
  const [bgColor, setBgColor] = useState<string>('bg-gradient-to-br from-indigo-500 to-purple-600');
  const [padding, setPadding] = useState<Padding>('md');
  const [isExporting, setIsExporting] = useState(false);
  const mockupRef = useRef<HTMLDivElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownload = useCallback(async () => {
    if (mockupRef.current) {
      try {
        setIsExporting(true);
        const dataUrl = await toPng(mockupRef.current, { 
          pixelRatio: 2,
          style: {
            transform: 'scale(1)',
            transformOrigin: 'top left'
          }
        });
        saveAs(dataUrl, 'mockup.png');
      } catch (err) {
        console.error('Failed to generate mockup', err);
        alert('导出失败，请重试。错误信息: ' + (err instanceof Error ? err.message : String(err)));
      } finally {
        setIsExporting(false);
      }
    }
  }, []);

  const bgColors = [
    'bg-gradient-to-br from-indigo-500 to-purple-600',
    'bg-gradient-to-br from-emerald-400 to-cyan-500',
    'bg-gradient-to-br from-rose-400 to-orange-400',
    'bg-gradient-to-br from-slate-800 to-slate-900',
    'bg-slate-200',
    'bg-white',
  ];

  const paddingMap = {
    sm: 'p-8',
    md: 'p-16',
    lg: 'p-24',
  };

  const renderBrowserFrame = () => (
    <div className="w-full max-w-4xl bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-200/50 flex flex-col">
      {browserType === 'mac' && (
        <div className="h-10 bg-slate-100 border-b border-slate-200 flex items-center px-4 gap-2 shrink-0">
          <div className="w-3 h-3 rounded-full bg-rose-400"></div>
          <div className="w-3 h-3 rounded-full bg-amber-400"></div>
          <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
        </div>
      )}
      {browserType === 'windows' && (
        <div className="h-10 bg-slate-100 border-b border-slate-200 flex items-center justify-end px-4 gap-4 shrink-0">
          <div className="w-3 h-[1px] bg-slate-500"></div>
          <div className="w-3 h-3 border border-slate-500"></div>
          <div className="w-3 h-3 flex items-center justify-center text-slate-500 text-xs">✕</div>
        </div>
      )}
      {browserType === 'linux' && (
        <div className="h-10 bg-slate-800 flex items-center justify-end px-4 gap-2 shrink-0">
          <div className="w-3 h-3 rounded-full bg-slate-600"></div>
          <div className="w-3 h-3 rounded-full bg-slate-600"></div>
          <div className="w-3 h-3 rounded-full bg-orange-500 flex items-center justify-center"><span className="text-[8px] text-white">✕</span></div>
        </div>
      )}
      <img src={image!} alt="Mockup" className="w-full h-auto block object-cover" />
    </div>
  );

  const renderMobileFrame = () => {
    if (mobileType === 'iphone') {
      return (
        <div className="w-[320px] bg-white rounded-[3rem] shadow-2xl overflow-hidden border-[12px] border-slate-900 relative shrink-0">
          <div className="absolute top-0 inset-x-0 h-6 flex justify-center z-10">
            <div className="w-32 h-6 bg-slate-900 rounded-b-3xl"></div>
          </div>
          <img src={image!} alt="Mockup" className="w-full h-auto block min-h-[600px] object-cover" />
        </div>
      );
    }
    if (mobileType === 'ipad') {
      return (
        <div className="w-[512px] bg-white rounded-[2rem] shadow-2xl overflow-hidden border-[16px] border-slate-900 relative shrink-0">
          <div className="absolute top-0 inset-x-0 h-4 flex justify-center items-center z-10 bg-slate-900">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-700"></div>
          </div>
          <img src={image!} alt="Mockup" className="w-full h-auto block min-h-[680px] object-cover" />
        </div>
      );
    }
    if (mobileType === 'macos') {
      return (
        <div className="w-full max-w-4xl bg-white rounded-t-2xl shadow-2xl overflow-hidden border-[16px] border-b-[48px] border-slate-900 relative shrink-0 flex flex-col">
          <div className="absolute top-[-12px] inset-x-0 flex justify-center items-center z-10">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-700"></div>
          </div>
          <img src={image!} alt="Mockup" className="w-full h-auto block object-cover" />
        </div>
      );
    }
  };

  const getMinWidth = () => {
    if (deviceCategory === 'browser') return '800px';
    if (mobileType === 'macos') return '800px';
    if (mobileType === 'ipad') return '600px';
    return '400px';
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8">
      {/* Controls Sidebar */}
      <div className="w-full lg:w-80 flex flex-col gap-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 shrink-0">
        <div>
          <h3 className="text-lg font-semibold text-slate-800 mb-4">截图设置</h3>
          
          {/* Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">图片</label>
            <label className="flex items-center justify-center w-full h-32 px-4 transition bg-white border-2 border-slate-300 border-dashed rounded-xl appearance-none cursor-pointer hover:border-emerald-400 focus:outline-none">
              <span className="flex items-center space-x-2">
                <Upload className="w-6 h-6 text-slate-400" />
                <span className="font-medium text-slate-600">
                  {image ? '更换图片' : '上传图片'}
                </span>
              </span>
              <input type="file" name="file_upload" className="hidden" accept="image/*" onChange={handleImageUpload} />
            </label>
          </div>

          {/* Device Category */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">设备类型</label>
            <div className="flex gap-2">
              <button
                onClick={() => setDeviceCategory('browser')}
                className={`flex-1 flex flex-col items-center justify-center py-2 rounded-lg border transition-colors ${deviceCategory === 'browser' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                <Layout className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">浏览器</span>
              </button>
              <button
                onClick={() => setDeviceCategory('mobile')}
                className={`flex-1 flex flex-col items-center justify-center py-2 rounded-lg border transition-colors ${deviceCategory === 'mobile' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                <Smartphone className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">移动设备</span>
              </button>
            </div>
          </div>

          {/* Sub-type */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">平台</label>
            {deviceCategory === 'browser' ? (
              <div className="flex gap-2">
                {(['mac', 'windows', 'linux'] as BrowserType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setBrowserType(type)}
                    className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors capitalize ${browserType === type ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex gap-2">
                {(['iphone', 'ipad', 'macos'] as MobileType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setMobileType(type)}
                    className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors capitalize ${mobileType === type ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >
                    {type === 'macos' ? 'macOS' : type === 'iphone' ? 'iPhone' : 'iPad'}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Background */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">背景</label>
            <div className="flex flex-wrap gap-3">
              {bgColors.map((color) => (
                <button
                  key={color}
                  onClick={() => setBgColor(color)}
                  className={`w-8 h-8 rounded-full border-2 shadow-sm ${color} ${bgColor === color ? 'border-emerald-500 ring-2 ring-emerald-200 ring-offset-1' : 'border-transparent hover:scale-110 transition-transform'}`}
                  style={(color === 'bg-white' || color === 'bg-slate-200') ? { border: '1px solid #cbd5e1' } : {}}
                  aria-label={`Select background ${color}`}
                />
              ))}
            </div>
          </div>

          {/* Padding */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">内边距</label>
            <div className="flex gap-2">
              {(['sm', 'md', 'lg'] as Padding[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPadding(p)}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${padding === p ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  {p.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Download */}
          <button
            onClick={handleDownload}
            disabled={!image || isExporting}
            className={`w-full flex items-center justify-center py-3 px-4 rounded-xl font-semibold text-white transition-colors ${!image || isExporting ? 'bg-slate-300 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-600 shadow-md hover:shadow-lg'}`}
          >
            {isExporting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                导出中...
              </>
            ) : (
              <>
                <Download className="w-5 h-5 mr-2" />
                导出截图
              </>
            )}
          </button>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden flex items-center justify-center min-h-[600px] relative">
        {!image ? (
          <div className="text-slate-400 flex flex-col items-center">
            <Monitor className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg font-medium">上传图片以查看预览</p>
          </div>
        ) : (
          <div className="overflow-auto max-h-full max-w-full p-4 flex items-center justify-center w-full h-full">
            <div
              ref={mockupRef}
              className={`transition-all duration-300 ease-in-out ${bgColor} ${paddingMap[padding]} flex items-center justify-center`}
              style={{ minWidth: getMinWidth() }}
            >
              {deviceCategory === 'browser' ? renderBrowserFrame() : renderMobileFrame()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { ImageCompressor } from './components/ImageCompressor';
import { PlaceholderTool } from './components/PlaceholderTool';
import { MockupGenerator } from './components/MockupGenerator';
import { Leaf, FileText, Settings, Menu, X, MonitorSmartphone } from 'lucide-react';

type Tab = 'image' | 'mockup' | 'pdf' | 'converter';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('image');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const tabs = [
    { id: 'image', name: '图片压缩', icon: Leaf },
    { id: 'mockup', name: '带壳截图', icon: MonitorSmartphone },
    { id: 'pdf', name: 'PDF 工具', icon: FileText },
    { id: 'converter', name: '格式转换', icon: Settings },
  ] as const;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center cursor-pointer" onClick={() => setActiveTab('image')}>
                <Leaf className="h-8 w-8 text-emerald-500" />
                <span className="ml-2 text-xl font-bold text-slate-800">TinyTools</span>
              </div>
              <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                        isActive
                          ? 'border-emerald-500 text-slate-900'
                          : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                      }`}
                    >
                      <Icon className={`w-4 h-4 mr-2 ${isActive ? 'text-emerald-500' : 'text-slate-400'}`} />
                      {tab.name}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="-mr-2 flex items-center sm:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-slate-500 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500"
              >
                <span className="sr-only">Open main menu</span>
                {mobileMenuOpen ? (
                  <X className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-slate-200">
            <div className="pt-2 pb-3 space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                      isActive
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                        : 'border-transparent text-slate-500 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-700'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-emerald-500' : 'text-slate-400'}`} />
                    {tab.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Active Tab Content */}
      <div className="flex-grow">
        {activeTab === 'image' && <ImageCompressor />}
        {activeTab === 'mockup' && <MockupGenerator />}
        {activeTab === 'pdf' && (
          <PlaceholderTool 
            title="PDF 工具" 
            description="轻松合并、拆分和压缩 PDF 文件。" 
          />
        )}
        {activeTab === 'converter' && (
          <PlaceholderTool 
            title="格式转换" 
            description="在 WebP、PNG、JPEG 等格式之间转换图片。" 
          />
        )}
      </div>

      {/* Footer */}
      <footer className="py-12 text-center text-slate-500 bg-slate-100 mt-auto">
        <p>灵感来自 TinyPNG。使用 React 和 Tailwind CSS 构建。</p>
        <p className="mt-2 text-sm">所有处理均在您的浏览器中本地完成。</p>
      </footer>
    </div>
  );
}

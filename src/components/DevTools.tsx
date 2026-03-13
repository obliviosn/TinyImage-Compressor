import React, { useState, useEffect } from 'react';
import { Code2, Hash, Link as LinkIcon, QrCode, Copy, Trash2, Clock, Check, Download, AlertCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import Editor from '@monaco-editor/react';

type ToolType = 'json' | 'base64' | 'url' | 'qrcode';

interface HistoryItem {
  id: string;
  tool: ToolType;
  input: string;
  output: string;
  timestamp: number;
  action?: string;
}

export function DevTools() {
  const [activeTool, setActiveTool] = useState<ToolType>('json');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const savedHistory = localStorage.getItem('devtools_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to parse history', e);
      }
    }
  }, []);

  const saveHistory = (newHistory: HistoryItem[]) => {
    setHistory(newHistory);
    localStorage.setItem('devtools_history', JSON.stringify(newHistory.slice(0, 50))); // Keep last 50
  };

  const addToHistory = (inputVal: string, outputVal: string, action?: string) => {
    if (!inputVal.trim()) return;
    const newItem: HistoryItem = {
      id: Math.random().toString(36).substring(7),
      tool: activeTool,
      input: inputVal,
      output: outputVal,
      timestamp: Date.now(),
      action,
    };
    saveHistory([newItem, ...history]);
  };

  const clearHistory = () => {
    if (window.confirm('确定要清空所有历史记录吗？')) {
      saveHistory([]);
    }
  };

  const handleCopy = async (text: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // JSON Tools
  const formatJson = () => {
    try {
      setError('');
      const parsed = JSON.parse(input);
      const formatted = JSON.stringify(parsed, null, 2);
      setOutput(formatted);
      addToHistory(input, formatted, '格式化');
    } catch (e) {
      setError('无效的 JSON 格式');
    }
  };

  const minifyJson = () => {
    try {
      setError('');
      const parsed = JSON.parse(input);
      const minified = JSON.stringify(parsed);
      setOutput(minified);
      addToHistory(input, minified, '压缩');
    } catch (e) {
      setError('无效的 JSON 格式');
    }
  };

  // Base64 Tools
  const encodeBase64 = () => {
    try {
      setError('');
      // Handle unicode characters properly
      const encoded = btoa(encodeURIComponent(input).replace(/%([0-9A-F]{2})/g,
        function toSolidBytes(match, p1) {
          return String.fromCharCode(Number('0x' + p1));
        }));
      setOutput(encoded);
      addToHistory(input, encoded, '加密');
    } catch (e) {
      setError('Base64 加密失败');
    }
  };

  const decodeBase64 = () => {
    try {
      setError('');
      const decoded = decodeURIComponent(atob(input).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      setOutput(decoded);
      addToHistory(input, decoded, '解密');
    } catch (e) {
      setError('无效的 Base64 字符串');
    }
  };

  // URL Tools
  const encodeUrl = () => {
    try {
      setError('');
      const encoded = encodeURIComponent(input);
      setOutput(encoded);
      addToHistory(input, encoded, '编码');
    } catch (e) {
      setError('URL 编码失败');
    }
  };

  const decodeUrl = () => {
    try {
      setError('');
      const decoded = decodeURIComponent(input);
      setOutput(decoded);
      addToHistory(input, decoded, '解码');
    } catch (e) {
      setError('无效的 URL 编码字符串');
    }
  };

  // QR Code
  const generateQrCode = () => {
    if (!input.trim()) {
      setError('请输入内容');
      return;
    }
    setError('');
    setOutput(input); // Just to trigger history and show it's generated
    addToHistory(input, 'QR_CODE_GENERATED', '生成');
  };

  const downloadQrCode = () => {
    const svg = document.getElementById('qr-code-svg');
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `qrcode_${Date.now()}.png`;
        downloadLink.href = `${pngFile}`;
        downloadLink.click();
      }
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const loadHistoryItem = (item: HistoryItem) => {
    setActiveTool(item.tool);
    setInput(item.input);
    if (item.output !== 'QR_CODE_GENERATED') {
      setOutput(item.output);
    } else {
      setOutput(item.input);
    }
    setError('');
  };

  const deleteHistoryItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    saveHistory(history.filter(item => item.id !== id));
  };

  const tools = [
    { id: 'json', name: 'JSON 工具', icon: Code2 },
    { id: 'base64', name: 'Base64', icon: Hash },
    { id: 'url', name: 'URL 编解码', icon: LinkIcon },
    { id: 'qrcode', name: '二维码生成', icon: QrCode },
  ] as const;

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return `${d.getMonth() + 1}-${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  // Reset state when changing tools
  useEffect(() => {
    setInput('');
    setOutput('');
    setError('');
  }, [activeTool]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Content */}
        <div className="flex-1 flex flex-col gap-6">
          {/* Tool Selector */}
          <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200 flex overflow-x-auto hide-scrollbar">
            {tools.map(tool => {
              const Icon = tool.icon;
              const isActive = activeTool === tool.id;
              return (
                <button
                  key={tool.id}
                  onClick={() => setActiveTool(tool.id)}
                  className={`flex items-center px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-colors ${
                    isActive 
                      ? 'bg-indigo-50 text-indigo-700' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 mr-2 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                  {tool.name}
                </button>
              );
            })}
          </div>

          {/* Tool Workspace */}
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800 flex items-center">
                {tools.find(t => t.id === activeTool)?.name}
              </h2>
              <div className="flex gap-2">
                {activeTool === 'json' && (
                  <>
                    <button onClick={formatJson} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">格式化</button>
                    <button onClick={minifyJson} className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg border border-slate-200 transition-colors">压缩</button>
                  </>
                )}
                {activeTool === 'base64' && (
                  <>
                    <button onClick={encodeBase64} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">加密 (Encode)</button>
                    <button onClick={decodeBase64} className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg border border-slate-200 transition-colors">解密 (Decode)</button>
                  </>
                )}
                {activeTool === 'url' && (
                  <>
                    <button onClick={encodeUrl} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">编码 (Encode)</button>
                    <button onClick={decodeUrl} className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg border border-slate-200 transition-colors">解码 (Decode)</button>
                  </>
                )}
                {activeTool === 'qrcode' && (
                  <button onClick={generateQrCode} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">生成二维码</button>
                )}
                <button onClick={() => { setInput(''); setOutput(''); setError(''); }} className="px-4 py-2 bg-white hover:bg-red-50 text-red-600 hover:text-red-700 text-sm font-medium rounded-lg border border-slate-200 transition-colors">清空</button>
              </div>
            </div>

            <div className="p-6 flex flex-col gap-6 flex-1">
              {error && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  {error}
                </div>
              )}

              <div className={`grid gap-6 ${activeTool === 'qrcode' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 h-[500px]'}`}>
                {/* Input Area */}
                <div className="flex flex-col h-full">
                  <label className="block text-sm font-medium text-slate-700 mb-2">输入</label>
                  {activeTool === 'json' ? (
                    <div className="flex-1 w-full border border-slate-200 rounded-2xl overflow-hidden">
                      <Editor
                        height="100%"
                        language="json"
                        value={input}
                        onChange={(val) => setInput(val || '')}
                        options={{
                          minimap: { enabled: false },
                          scrollBeyondLastLine: false,
                          wordWrap: 'on',
                          fontSize: 14,
                          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                          padding: { top: 16, bottom: 16 },
                        }}
                        theme="light"
                      />
                    </div>
                  ) : (
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      className="flex-1 w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm resize-none"
                      placeholder="在此输入内容..."
                    />
                  )}
                </div>

                {/* Output Area */}
                <div className="flex flex-col h-full relative">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-slate-700">输出</label>
                    {activeTool !== 'qrcode' && output && (
                      <button 
                        onClick={() => handleCopy(output)}
                        className="text-slate-400 hover:text-indigo-600 flex items-center text-xs font-medium transition-colors"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                        {copied ? '已复制' : '复制'}
                      </button>
                    )}
                  </div>
                  
                  {activeTool === 'qrcode' ? (
                    <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 border border-slate-200 rounded-2xl p-8 min-h-[300px]">
                      {output ? (
                        <>
                          <div className="bg-white p-4 rounded-xl shadow-sm mb-6">
                            <QRCodeSVG 
                              id="qr-code-svg"
                              value={output} 
                              size={200} 
                              level="H"
                              includeMargin={true}
                            />
                          </div>
                          <button 
                            onClick={downloadQrCode}
                            className="flex items-center px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-medium transition-colors shadow-sm"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            下载图片
                          </button>
                        </>
                      ) : (
                        <div className="text-slate-400 flex flex-col items-center">
                          <QrCode className="w-12 h-12 mb-3 opacity-20" />
                          <p className="text-sm">输入内容并点击生成</p>
                        </div>
                      )}
                    </div>
                  ) : activeTool === 'json' ? (
                    <div className="flex-1 w-full border border-slate-200 rounded-2xl overflow-hidden relative">
                      <Editor
                        height="100%"
                        language="json"
                        value={output}
                        options={{
                          readOnly: true,
                          minimap: { enabled: false },
                          scrollBeyondLastLine: false,
                          wordWrap: 'on',
                          fontSize: 14,
                          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                          padding: { top: 16, bottom: 16 },
                          folding: true,
                        }}
                        theme="light"
                      />
                    </div>
                  ) : (
                    <textarea
                      value={output}
                      readOnly
                      className="flex-1 w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none font-mono text-sm resize-none text-slate-700"
                      placeholder="结果将显示在这里..."
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* History Sidebar */}
        <div className="w-full lg:w-80 flex flex-col gap-4">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden flex flex-col h-[600px]">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 flex items-center">
                <Clock className="w-4 h-4 mr-2 text-slate-500" />
                历史记录
              </h3>
              {history.length > 0 && (
                <button 
                  onClick={clearHistory}
                  className="text-xs text-slate-500 hover:text-red-600 transition-colors"
                >
                  清空
                </button>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto p-2">
              {history.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                  <Clock className="w-8 h-8 mb-2 opacity-20" />
                  <p className="text-sm">暂无历史记录</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {history.map(item => (
                    <div 
                      key={item.id}
                      onClick={() => loadHistoryItem(item)}
                      className="p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 cursor-pointer transition-all group relative"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                          {tools.find(t => t.id === item.tool)?.name || item.tool}
                          {item.action && ` - ${item.action}`}
                        </span>
                        <span className="text-[10px] text-slate-400">{formatDate(item.timestamp)}</span>
                      </div>
                      <p className="text-sm text-slate-600 line-clamp-2 font-mono text-xs mt-2 break-all">
                        {item.input}
                      </p>
                      <button 
                        onClick={(e) => deleteHistoryItem(e, item.id)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

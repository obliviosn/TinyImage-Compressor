import React from 'react';
import { Wrench } from 'lucide-react';

interface PlaceholderToolProps {
  title: string;
  description: string;
}

export function PlaceholderTool({ title, description }: PlaceholderToolProps) {
  return (
    <>
      {/* Header / Hero */}
      <header className="relative overflow-hidden bg-gradient-to-b from-indigo-500 to-indigo-600 pb-32 pt-16 text-center text-white">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
        <div className="relative z-10 max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-center mb-6 space-x-3">
            <div className="p-3 bg-white rounded-2xl shadow-lg">
              <Wrench className="w-10 h-10 text-indigo-500" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
              {title}
            </h1>
          </div>
          <p className="max-w-2xl mx-auto text-xl font-medium text-indigo-50 sm:text-2xl">
            {description}
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-20 px-4 pb-24 -mt-24">
        <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl p-8 sm:p-12 text-center min-h-[400px] flex flex-col items-center justify-center">
          <Wrench className="w-16 h-16 text-slate-300 mb-4" />
          <h2 className="text-2xl font-bold text-slate-700 mb-2">Coming Soon</h2>
          <p className="text-slate-500 max-w-md mx-auto">
            We are working hard to bring you this new tool. Check back later for updates!
          </p>
        </div>
      </main>
    </>
  );
}

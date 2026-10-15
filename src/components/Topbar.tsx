'use client';

import React from 'react';
import { Sparkles, RefreshCw, Sun, Moon, Github } from 'lucide-react';
import { IndicScript } from '@/types';

interface TopbarProps {
  selectedScriptFilter: IndicScript | 'All';
  onOpenFontRegistry: () => void;
  onReset: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  selectedScriptFilter,
  onOpenFontRegistry,
  onReset,
  isDarkMode,
  onToggleDarkMode,
}) => {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-2.5 bg-white/80 dark:bg-[#191919]/80 backdrop-blur-md border-b border-[#37352F]/10 dark:border-white/10">
      {/* Notion Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-base">📜</span>
        <span className="font-medium text-[#37352F] dark:text-[#D4D4D4]">
          LangCraft
        </span>
        <span className="text-[#787774] dark:text-[#9B9B9B]">/</span>
        <span className="text-[#787774] dark:text-[#9B9B9B]">Converters</span>
        <span className="text-[#787774] dark:text-[#9B9B9B]">/</span>
        <span className="font-semibold text-[#37352F] dark:text-white">
          Indic DOCX Engine
        </span>
        {selectedScriptFilter !== 'All' && (
          <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#2383E2]/10 text-[#2383E2]">
            Filter: {selectedScriptFilter}
          </span>
        )}
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenFontRegistry}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded hover:bg-[#37352F]/5 dark:hover:bg-white/5 text-[#37352F] dark:text-[#D4D4D4] transition-colors"
          title="Open Font Substitution Registry"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#2383E2]" />
          <span className="hidden sm:inline">Font Registry</span>
        </button>

        <button
          onClick={onReset}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded hover:bg-[#37352F]/5 dark:hover:bg-white/5 text-[#787774] dark:text-[#9B9B9B] transition-colors"
          title="Reset Workspace"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reset</span>
        </button>

        <button
          onClick={onToggleDarkMode}
          className="p-1.5 rounded hover:bg-[#37352F]/5 dark:hover:bg-white/5 text-[#787774] dark:text-[#9B9B9B] transition-colors"
          title="Toggle Theme"
        >
          {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <a
          href="https://github.com/sheikhsajid69/langcraft.git"
          target="_blank"
          rel="noreferrer"
          className="p-1.5 rounded hover:bg-[#37352F]/5 dark:hover:bg-white/5 text-[#787774] dark:text-[#9B9B9B] transition-colors"
          title="View GitHub Repository"
        >
          <Github className="w-4 h-4" />
        </a>
      </div>
    </header>
  );
};

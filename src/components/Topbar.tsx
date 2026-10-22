'use client';

import React from 'react';
import Image from 'next/image';
import { Menu, Sparkles, RefreshCw, Sun, Moon, Github } from 'lucide-react';
import { IndicScript } from '@/types';

interface TopbarProps {
  selectedScriptFilter: IndicScript | 'All';
  onOpenFontRegistry: () => void;
  onReset: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onToggleSidebar?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  selectedScriptFilter,
  onOpenFontRegistry,
  onReset,
  isDarkMode,
  onToggleDarkMode,
  onToggleSidebar,
}) => {
  return (
    <header className="sticky top-0 z-30 flex h-[48px] items-center justify-between border-b border-[#37352F]/10 bg-white/95 px-3 sm:px-6 dark:border-white/10 dark:bg-[#191919]/95 backdrop-blur-sm">
      {/* Left: Mobile Menu & Notion Breadcrumbs */}
      <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="p-1.5 rounded-md hover:bg-[#37352F]/5 dark:hover:bg-white/5 text-[#37352F] dark:text-[#D4D4D4] transition-colors md:hidden shrink-0"
            title="Toggle Sidebar"
            aria-label="Toggle Navigation Sidebar"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 sm:gap-2 text-xs">
          <Image
            src="/logo.png"
            alt=""
            width={22}
            height={22}
            className="h-5.5 w-5.5 shrink-0 rounded-md border border-black/5 shadow-xs dark:border-white/10"
          />
          <span className="font-semibold text-[#37352F] dark:text-[#D4D4D4] shrink-0">
            LangCraft
          </span>
          <span className="text-[#787774] dark:text-[#9B9B9B]">/</span>
          <span className="truncate font-medium text-[#37352F] dark:text-white max-w-[130px] sm:max-w-none">
            Indic DOCX-to-PDF
          </span>
          {selectedScriptFilter !== 'All' && (
            <span className="hidden shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium bg-[#2383E2]/10 text-[#2383E2] sm:inline">
              {selectedScriptFilter}
            </span>
          )}
        </nav>
      </div>

      {/* Right: Action Controls */}
      <div className="ml-2 flex shrink-0 items-center gap-0.5 sm:gap-1">
        <span className="mr-1 hidden items-center gap-1.5 rounded border border-[#0F7B6C]/20 bg-[#0F7B6C]/10 px-2 py-1 text-[10px] font-medium text-[#0F7B6C] lg:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-[#0F7B6C] animate-pulse" />
          HarfBuzz ready
        </span>

        <button
          onClick={onOpenFontRegistry}
          className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-[#37352F] transition-colors hover:bg-[#37352F]/5 dark:text-[#D4D4D4] dark:hover:bg-white/5"
          title="Open Font Substitution Registry"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#2383E2]" />
          <span className="hidden sm:inline">Font Registry</span>
        </button>

        <button
          onClick={onReset}
          className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-[#787774] transition-colors hover:bg-[#37352F]/5 dark:text-[#9B9B9B] dark:hover:bg-white/5"
          title="Reset Workspace"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reset</span>
        </button>

        <button
          onClick={onToggleDarkMode}
          className="rounded-md p-1.5 text-[#787774] transition-colors hover:bg-[#37352F]/5 dark:text-[#9B9B9B] dark:hover:bg-white/5"
          title="Toggle Theme"
        >
          {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <a
          href="https://github.com/sheikhsajid69/langcraft"
          target="_blank"
          rel="noreferrer"
          className="rounded-md p-1.5 text-[#787774] transition-colors hover:bg-[#37352F]/5 dark:text-[#9B9B9B] dark:hover:bg-white/5"
          title="View GitHub Repository"
        >
          <Github className="w-4 h-4" />
        </a>
      </div>
    </header>
  );
};

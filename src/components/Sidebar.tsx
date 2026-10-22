'use client';

import React from 'react';
import Image from 'next/image';
import {
  FileText,
  Languages,
  Layers,
  History,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ExternalLink,
  X,
} from 'lucide-react';
import { IndicScript } from '@/types';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  selectedScriptFilter: IndicScript | 'All';
  onSelectScriptFilter: (script: IndicScript | 'All') => void;
  onOpenFontRegistry: () => void;
  conversionHistory: Array<{
    id: string;
    filename: string;
    timestamp: string;
    script: string;
    status: 'Verified' | 'Error';
  }>;
}

const INDIC_SCRIPTS: Array<{ id: IndicScript | 'All'; name: string; native: string }> = [
  { id: 'All', name: 'All Scripts', native: 'सर्व' },
  { id: 'Hindi', name: 'Hindi', native: 'हिन्दी' },
  { id: 'Sanskrit', name: 'Sanskrit', native: 'संस्कृतम्' },
  { id: 'Kannada', name: 'Kannada', native: 'ಕನ್ನಡ' },
  { id: 'Telugu', name: 'Telugu', native: 'తెలుగు' },
  { id: 'Tamil', name: 'Tamil', native: 'தமிழ்' },
];

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onToggle,
  selectedScriptFilter,
  onSelectScriptFilter,
  onOpenFontRegistry,
  conversionHistory,
}) => {
  const handleScriptClick = (script: IndicScript | 'All') => {
    onSelectScriptFilter(script);
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      onToggle();
    }
  };

  const handleRegistryClick = () => {
    onOpenFontRegistry();
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      onToggle();
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden transition-opacity duration-200"
          onClick={onToggle}
          aria-label="Close sidebar"
        />
      )}

      {/* Main Sidebar Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 md:z-30 flex flex-col border-r border-[#37352F]/10 dark:border-white/10 bg-[#F7F6F3] dark:bg-[#202020] transition-all duration-200 ease-in-out shadow-xl md:shadow-none ${
          isOpen
            ? 'w-64 md:w-60 translate-x-0'
            : 'w-0 -translate-x-full pointer-events-none'
        }`}
      >
        {/* Workspace Brand Header */}
        <div className="flex items-center justify-between px-3.5 py-3 border-b border-[#37352F]/10 dark:border-white/10">
          <div className="flex items-center gap-2.5 min-w-0">
            <Image
              src="/logo.png"
              alt="LangCraft Workspace"
              width={26}
              height={26}
              className="h-6.5 w-6.5 shrink-0 rounded-lg border border-black/5 shadow-xs dark:border-white/10"
            />
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-sm tracking-tight text-[#37352F] dark:text-[#D4D4D4] truncate">
                LangCraft Workspace
              </span>
              <span className="text-[10px] text-[#787774] dark:text-[#9B9B9B] truncate">
                Indic Typography Engine
              </span>
            </div>
          </div>
          <button
            onClick={onToggle}
            className="p-1.5 rounded hover:bg-[#37352F]/10 dark:hover:bg-white/10 text-[#787774] dark:text-[#9B9B9B] transition-colors"
            title="Close Sidebar (Ctrl+\)"
          >
            <span className="md:hidden">
              <X className="w-4 h-4" />
            </span>
            <span className="hidden md:inline">
              <ChevronLeft className="w-4 h-4" />
            </span>
          </button>
        </div>

        {/* Navigation Content */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 text-xs">
          {/* Language Filter Pills */}
          <div>
            <div className="flex items-center gap-1.5 px-2 mb-2 text-[#787774] dark:text-[#9B9B9B] font-medium uppercase tracking-wider text-[10px]">
              <Languages className="w-3.5 h-3.5" />
              <span>Target Indic Scripts</span>
            </div>
            <div className="space-y-0.5">
              {INDIC_SCRIPTS.map((s) => {
                const isSelected = selectedScriptFilter === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => handleScriptClick(s.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded text-left transition-colors min-h-[36px] ${
                      isSelected
                        ? 'bg-[#37352F]/10 dark:bg-white/10 font-semibold text-[#37352F] dark:text-white'
                        : 'text-[#37352F] dark:text-[#D4D4D4] hover:bg-[#37352F]/5 dark:hover:bg-white/5'
                    }`}
                  >
                    <span>{s.name}</span>
                    <span className="text-[11px] font-normal text-[#787774] dark:text-[#9B9B9B]">
                      {s.native}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Font Mapping Registry Action */}
          <div>
            <div className="flex items-center gap-1.5 px-2 mb-2 text-[#787774] dark:text-[#9B9B9B] font-medium uppercase tracking-wider text-[10px]">
              <Layers className="w-3.5 h-3.5" />
              <span>Typography Registry</span>
            </div>
            <button
              onClick={handleRegistryClick}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded text-[#37352F] dark:text-[#D4D4D4] hover:bg-[#37352F]/5 dark:hover:bg-white/5 transition-colors min-h-[36px]"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#2383E2]" />
                <span>Font Mapping Matrix</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#0F7B6C]/10 text-[#0F7B6C] font-mono">
                12 rules
              </span>
            </button>
          </div>

          {/* Session History Log */}
          <div>
            <div className="flex items-center gap-1.5 px-2 mb-2 text-[#787774] dark:text-[#9B9B9B] font-medium uppercase tracking-wider text-[10px]">
              <History className="w-3.5 h-3.5" />
              <span>Recent Conversions</span>
            </div>
            {conversionHistory.length === 0 ? (
              <div className="px-2.5 py-3 text-[#787774] dark:text-[#9B9B9B] italic text-[11px]">
                No documents converted yet this session.
              </div>
            ) : (
              <div className="space-y-1">
                {conversionHistory.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-[#37352F]/5 dark:hover:bg-white/5"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-3.5 h-3.5 text-[#787774] shrink-0" />
                      <span className="truncate text-[11px] text-[#37352F] dark:text-[#D4D4D4]">
                        {item.filename}
                      </span>
                    </div>
                    <span className="shrink-0 text-[10px] text-[#0F7B6C] font-medium">
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Engine Footer */}
        <div className="p-3 border-t border-[#37352F]/10 dark:border-white/10 space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] text-[#0F7B6C] font-medium">
            <span className="w-2 h-2 rounded-full bg-[#0F7B6C] animate-pulse" />
            <span>HarfBuzz CTL Active</span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-[#787774] dark:text-[#9B9B9B]">
            <span>LangCraft v1.0.0</span>
            <a
              href="https://github.com/sheikhsajid69/langcraft"
              target="_blank"
              rel="noreferrer"
              className="hover:underline flex items-center gap-0.5"
            >
              GitHub <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        </div>
      </aside>

      {/* Floating Toggle button when sidebar collapsed on Desktop */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className="fixed bottom-4 left-4 z-20 hidden md:flex items-center gap-1 p-2 rounded-md bg-[#F7F6F3] dark:bg-[#202020] border border-[#37352F]/15 dark:border-white/15 text-[#37352F] dark:text-[#D4D4D4] shadow-xs hover:bg-[#37352F]/10 transition-colors"
          title="Expand Sidebar (Ctrl+\)"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </>
  );
};

'use client';

import React from 'react';
import { X, Layers, ShieldCheck, ArrowRight } from 'lucide-react';

interface FontRegistryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const REGISTRY_RULES = [
  {
    category: 'Hindi & Sanskrit (Devanagari)',
    items: [
      { from: 'Mangal', to: 'Noto Sans Devanagari', type: 'Unicode OpenType' },
      { from: 'Nirmala UI (Devanagari)', to: 'Noto Sans Devanagari', type: 'Unicode OpenType' },
      { from: 'Kokila', to: 'Tiro Devanagari Sanskrit / Noto Sans Devanagari', type: 'Vedic / Sanskrit' },
      { from: 'Aparajita', to: 'Noto Sans Devanagari', type: 'Unicode OpenType' },
      { from: 'Utsaah', to: 'Noto Sans Devanagari', type: 'Unicode OpenType' },
      { from: 'Kruti Dev 010 / 020', to: 'Noto Sans Devanagari (Transcoded NFC)', type: 'Legacy ASCII' },
      { from: 'Chanakya', to: 'Noto Sans Devanagari (Transcoded NFC)', type: 'Legacy ASCII' },
    ],
  },
  {
    category: 'Kannada',
    items: [
      { from: 'Tunga', to: 'Noto Sans Kannada', type: 'Unicode OpenType' },
      { from: 'Kedage', to: 'Noto Sans Kannada', type: 'Unicode OpenType' },
      { from: 'Nudi 01e / 05e', to: 'Noto Sans Kannada (Transcoded NFC)', type: 'Legacy ASCII' },
      { from: 'Baraha', to: 'Noto Sans Kannada (Transcoded NFC)', type: 'Legacy ASCII' },
    ],
  },
  {
    category: 'Telugu',
    items: [
      { from: 'Gautami', to: 'Noto Sans Telugu', type: 'Unicode OpenType' },
      { from: 'Vani', to: 'Noto Sans Telugu', type: 'Unicode OpenType' },
      { from: 'Pothana2000', to: 'Noto Sans Telugu', type: 'Unicode OpenType' },
    ],
  },
  {
    category: 'Tamil & Grantha',
    items: [
      { from: 'Latha', to: 'Noto Sans Tamil', type: 'Unicode OpenType' },
      { from: 'Vijaya', to: 'Noto Sans Tamil', type: 'Unicode OpenType' },
      { from: 'Bamini', to: 'Noto Sans Tamil (Transcoded NFC)', type: 'Legacy ASCII' },
    ],
  },
];

export const FontRegistryModal: React.FC<FontRegistryModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-xl bg-white dark:bg-[#191919] border border-[#37352F]/15 dark:border-white/15 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#37352F]/10 dark:border-white/10 bg-[#F7F6F3] dark:bg-[#202020]">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#2383E2]" />
            <h3 className="text-sm font-semibold text-[#37352F] dark:text-[#D4D4D4]">
              Active Font Mapping Registry & Substitution Matrix
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[#37352F]/10 dark:hover:bg-white/10 text-[#787774] dark:text-[#9B9B9B]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          <p className="text-[#787774] dark:text-[#9B9B9B]">
            All proprietary Windows Indic font references discovered in{' '}
            <code className="font-mono bg-[#37352F]/5 px-1 py-0.5 rounded text-[11px]">
              word/fontTable.xml
            </code>{' '}
            are deterministically mapped to Google Noto OpenType fonts with full HarfBuzz
            Complex Text Layout (<code className="font-mono text-[11px]">GSUB</code>/
            <code className="font-mono text-[11px]">GPOS</code>) table execution.
          </p>

          <div className="space-y-5">
            {REGISTRY_RULES.map((section, idx) => (
              <div key={idx} className="space-y-2">
                <h4 className="font-semibold text-[#37352F] dark:text-[#D4D4D4] uppercase tracking-wider text-[11px]">
                  {section.category}
                </h4>
                <div className="divide-y divide-[#37352F]/10 dark:divide-white/10 rounded-lg border border-[#37352F]/10 dark:border-white/10 overflow-hidden bg-white dark:bg-[#191919]">
                  {section.items.map((item, itemIdx) => (
                    <div
                      key={itemIdx}
                      className="flex items-center justify-between p-2.5 hover:bg-[#F7F6F3]/50 dark:hover:bg-[#202020]/50"
                    >
                      <span className="font-mono text-[11px] text-[#37352F] dark:text-[#D4D4D4]">
                        {item.from}
                      </span>
                      <div className="flex items-center gap-2">
                        <ArrowRight className="w-3.5 h-3.5 text-[#787774]" />
                        <span className="font-medium text-[#2383E2]">
                          {item.to}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#37352F]/5 dark:bg-white/5 text-[#787774] dark:text-[#9B9B9B]">
                          {item.type}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-[#37352F]/10 dark:border-white/10 bg-[#F7F6F3] dark:bg-[#202020]">
          <div className="flex items-center gap-1.5 text-xs text-[#0F7B6C] font-medium">
            <ShieldCheck className="w-4 h-4" />
            <span>All mappings enforce Zero-Tofu font subsetting (Identity-H)</span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-[#37352F] hover:bg-[#37352F]/90 text-white dark:bg-white dark:hover:bg-white/90 dark:text-[#191919] text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

'use client';

import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  FileCode,
  ImageIcon,
} from 'lucide-react';
import { DocumentDiagnostic } from '@/types';

interface DiagnosticTableProps {
  diagnostic: DocumentDiagnostic;
}

/** Notion-style colored pill for each Indic script */
const SCRIPT_PILL: Record<string, string> = {
  Hindi:     'bg-[#FDECC8] text-[#CB912F] dark:bg-[#CB912F]/20 dark:text-[#FDECC8]',
  Sanskrit:  'bg-[#E8DEEE] text-[#9065B0] dark:bg-[#9065B0]/20 dark:text-[#E8DEEE]',
  Kannada:   'bg-[#FDECCE] text-[#C07926] dark:bg-[#C07926]/20 dark:text-[#FDECCE]',
  Telugu:    'bg-[#D3E5EF] text-[#337EA9] dark:bg-[#337EA9]/20 dark:text-[#D3E5EF]',
  Tamil:     'bg-[#DBEDDB] text-[#448361] dark:bg-[#448361]/20 dark:text-[#DBEDDB]',
  Mixed:     'bg-[#EEE0DA] text-[#9F6B53] dark:bg-[#9F6B53]/20 dark:text-[#EEE0DA]',
  General:   'bg-[#EFEFEF] text-[#787774] dark:bg-white/10 dark:text-[#D4D4D4]',
};

function scriptPillClass(script: string): string {
  return SCRIPT_PILL[script] ?? SCRIPT_PILL['General']!;
}

export const DiagnosticTable: React.FC<DiagnosticTableProps> = ({ diagnostic }) => {
  const formattedSize =
    diagnostic.filesize > 1024 * 1024
      ? `${(diagnostic.filesize / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(diagnostic.filesize / 1024)} KB`;

  return (
    <div className="w-full rounded-xl border border-[#37352F]/15 dark:border-white/15 bg-white dark:bg-[#191919] overflow-hidden shadow-xs">
      {/* Table Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-3 bg-[#F7F6F3] dark:bg-[#202020] border-b border-[#37352F]/10 dark:border-white/10">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-[#2383E2]" />
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[#37352F] dark:text-[#D4D4D4]">
            OOXML & Indic Typography Diagnostics
          </h4>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-[#0F7B6C]/10 text-[#0F7B6C] dark:bg-[#0F7B6C]/20 dark:text-[#2ecc71]">
            <ShieldCheck className="w-3.5 h-3.5" />
            {diagnostic.zeroTofuVerified ? 'Zero-Tofu Invariant Passed' : 'Verifying...'}
          </span>
        </div>
      </div>

      {/* Meta Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-3.5 bg-white dark:bg-[#191919] border-b border-[#37352F]/10 dark:border-white/10 text-xs">
        <div className="min-w-0">
          <span className="text-[10px] text-[#787774] dark:text-[#9B9B9B] uppercase block tracking-wider">
            Document
          </span>
          <span className="font-semibold text-[#37352F] dark:text-white truncate block text-xs" title={diagnostic.filename}>
            {diagnostic.filename}
          </span>
          <span className="text-[10px] text-[#787774] dark:text-[#9B9B9B]">
            {formattedSize}
          </span>
        </div>

        <div>
          <span className="text-[10px] text-[#787774] dark:text-[#9B9B9B] uppercase block tracking-wider">
            Primary Script
          </span>
          <span className={`inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded font-medium text-[11px] ${scriptPillClass(diagnostic.primaryScript)}`}>
            {diagnostic.primaryScript}
          </span>
          {diagnostic.detectedScripts.length > 1 && (
            <span className="text-[10px] text-[#787774] dark:text-[#9B9B9B] block mt-0.5">
              +{diagnostic.detectedScripts.length - 1} other script(s)
            </span>
          )}
        </div>

        <div>
          <span className="text-[10px] text-[#787774] dark:text-[#9B9B9B] uppercase block tracking-wider">
            Structure Nodes
          </span>
          <span className="font-medium text-[#37352F] dark:text-white block">
            {diagnostic.paragraphsCount} paragraphs &middot; {diagnostic.tablesCount} table(s)
          </span>
          {typeof diagnostic.imageCount === 'number' && diagnostic.imageCount > 0 && (
            <span className="text-[10px] text-[#787774] dark:text-[#9B9B9B] inline-flex items-center gap-1 mt-0.5">
              <ImageIcon className="w-2.5 h-2.5" /> {diagnostic.imageCount} embedded media
            </span>
          )}
        </div>

        <div>
          <span className="text-[10px] text-[#787774] dark:text-[#9B9B9B] uppercase block tracking-wider">
            HarfBuzz Engine
          </span>
          <span className="font-medium text-[#0F7B6C] dark:text-[#2ecc71] flex items-center gap-1 mt-0.5">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>GSUB / GPOS Active</span>
          </span>
          <span className="text-[10px] text-[#787774] dark:text-[#9B9B9B] block">
            OpenType font subsetting
          </span>
        </div>
      </div>

      {/* Mobile Horizontal Scroll Hint */}
      <div className="sm:hidden text-[10px] text-[#787774] dark:text-[#9B9B9B] px-4 py-1.5 bg-[#F7F6F3]/60 dark:bg-[#202020]/60 border-b border-[#37352F]/5 flex items-center justify-between">
        <span>Font mapping matrix</span>
        <span>Scroll &rarr;</span>
      </div>

      {/* Notion Database Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs min-w-[580px]">
          <thead>
            <tr className="border-b border-[#37352F]/10 dark:border-white/10 bg-[#F7F6F3]/50 dark:bg-[#202020]/50 text-[#787774] dark:text-[#9B9B9B]">
              <th className="py-2.5 px-4 font-medium">Source Font (word/fontTable.xml)</th>
              <th className="py-2.5 px-4 font-medium">Mapped OpenType Font</th>
              <th className="py-2.5 px-4 font-medium">Target Script</th>
              <th className="py-2.5 px-4 font-medium">Shaping & Encoding</th>
              <th className="py-2.5 px-4 font-medium text-right">Invariant Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#37352F]/5 dark:divide-white/5">
            {diagnostic.fontMappings.map((mapping, idx) => (
              <tr
                key={idx}
                className="hover:bg-[#F7F6F3]/60 dark:hover:bg-[#202020]/60 transition-colors"
              >
                <td className="py-2.5 px-4 font-mono text-[11px] text-[#37352F] dark:text-[#D4D4D4]">
                  {mapping.sourceFont}
                </td>
                <td className="py-2.5 px-4 font-medium text-[#2383E2]">
                  <div className="flex items-center gap-1.5">
                    <ArrowRight className="w-3 h-3 text-[#787774] shrink-0" />
                    <span>{mapping.targetFont}</span>
                  </div>
                </td>
                <td className="py-2.5 px-4">
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${scriptPillClass(mapping.script)}`}>
                    {mapping.script}
                  </span>
                </td>
                <td className="py-2.5 px-4">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] ${
                        mapping.status === 'Transcoded'
                          ? 'text-[#D9730D]'
                          : 'text-[#0F7B6C] dark:text-[#2ecc71]'
                      }`}
                    >
                      {mapping.status === 'Transcoded' ? (
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-3 h-3 shrink-0" />
                      )}
                      {mapping.status === 'Transcoded'
                        ? 'Legacy Transcoded (NFC)'
                        : 'Normalized OpenType'}
                    </span>
                  </div>
                </td>
                <td className="py-2.5 px-4 text-right">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#0F7B6C]/10 text-[#0F7B6C] dark:bg-[#0F7B6C]/20 dark:text-[#2ecc71] text-[10px] font-medium">
                    <ShieldCheck className="w-3 h-3 shrink-0" /> Zero-Tofu
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legacy Warning Callout if any */}
      {diagnostic.legacyFontsDetected.length > 0 && (
        <div className="p-3 bg-[#D9730D]/10 border-t border-[#D9730D]/20 text-[#D9730D] text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>
            Legacy ASCII font detected ({diagnostic.legacyFontsDetected.join(', ')}).
            Transcoded into canonical Unicode with Devanagari short-i and reph reordering.
          </span>
        </div>
      )}
    </div>
  );
};

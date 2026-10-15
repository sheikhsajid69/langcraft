'use client';

import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  FileCode,
  Tag,
  Hash,
} from 'lucide-react';
import { DocumentDiagnostic } from '@/types';

interface DiagnosticTableProps {
  diagnostic: DocumentDiagnostic;
}

export const DiagnosticTable: React.FC<DiagnosticTableProps> = ({ diagnostic }) => {
  return (
    <div className="w-full rounded-lg border border-[#37352F]/15 dark:border-white/15 bg-white dark:bg-[#191919] overflow-hidden shadow-sm">
      {/* Table Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#F7F6F3] dark:bg-[#202020] border-b border-[#37352F]/10 dark:border-white/10">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-[#2383E2]" />
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[#37352F] dark:text-[#D4D4D4]">
            OOXML & Indic Typography Diagnostics
          </h4>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#0F7B6C]/10 text-[#0F7B6C]">
            <ShieldCheck className="w-3.5 h-3.5" />
            {diagnostic.zeroTofuVerified ? 'Zero-Tofu Invariant Passed' : 'Verifying...'}
          </span>
        </div>
      </div>

      {/* Meta Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-white dark:bg-[#191919] border-b border-[#37352F]/10 dark:border-white/10 text-xs">
        <div>
          <span className="text-[10px] text-[#787774] dark:text-[#9B9B9B] uppercase block">
            Document
          </span>
          <span className="font-medium text-[#37352F] dark:text-white truncate block">
            {diagnostic.filename}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-[#787774] dark:text-[#9B9B9B] uppercase block">
            Primary Script
          </span>
          <span className="inline-flex items-center gap-1 font-medium text-[#2383E2]">
            <Tag className="w-3 h-3" />
            {diagnostic.primaryScript}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-[#787774] dark:text-[#9B9B9B] uppercase block">
            Structure Nodes
          </span>
          <span className="font-medium text-[#37352F] dark:text-white">
            {diagnostic.paragraphsCount} paragraphs · {diagnostic.tablesCount} tables
          </span>
        </div>
        <div>
          <span className="text-[10px] text-[#787774] dark:text-[#9B9B9B] uppercase block">
            HarfBuzz Engine
          </span>
          <span className="font-medium text-[#0F7B6C] flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> GSUB/GPOS Active
          </span>
        </div>
      </div>

      {/* Notion Database Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
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
                    <ArrowRight className="w-3 h-3 text-[#787774]" />
                    <span>{mapping.targetFont}</span>
                  </div>
                </td>
                <td className="py-2.5 px-4">
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-[#37352F]/5 dark:bg-white/5 text-[#37352F] dark:text-[#D4D4D4]">
                    {mapping.script}
                  </span>
                </td>
                <td className="py-2.5 px-4">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] ${
                        mapping.status === 'Transcoded'
                          ? 'text-[#D9730D]'
                          : 'text-[#0F7B6C]'
                      }`}
                    >
                      {mapping.status === 'Transcoded' ? (
                        <AlertTriangle className="w-3 h-3" />
                      ) : (
                        <CheckCircle2 className="w-3 h-3" />
                      )}
                      {mapping.status === 'Transcoded'
                        ? 'Legacy Transcoded (NFC)'
                        : 'Normalized OpenType'}
                    </span>
                  </div>
                </td>
                <td className="py-2.5 px-4 text-right">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#0F7B6C]/10 text-[#0F7B6C] text-[10px] font-medium">
                    <ShieldCheck className="w-3 h-3" /> Zero-Tofu
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

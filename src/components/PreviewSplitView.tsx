'use client';

import React, { useState } from 'react';
import {
  Download,
  Eye,
  FileCheck,
  ShieldCheck,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Copy,
  Check,
  Printer,
  FileDown,
  Loader2,
} from 'lucide-react';
import { DocumentDiagnostic } from '@/types';

interface PreviewSplitViewProps {
  htmlContent: string;
  pdfBase64?: string;
  pdfUrl?: string;
  pdfFilename?: string;
  diagnostic: DocumentDiagnostic;
  normalizedDocxBlob?: Blob;
  extractedText?: string;
  isLoadingPdf?: boolean;
}

export const PreviewSplitView: React.FC<PreviewSplitViewProps> = ({
  htmlContent,
  pdfBase64,
  pdfUrl,
  pdfFilename = 'langcraft-output.pdf',
  diagnostic,
  normalizedDocxBlob,
  extractedText,
  isLoadingPdf = false,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [copied, setCopied] = useState<boolean>(false);
  const [mobileTab, setMobileTab] = useState<'preview' | 'pdf'>('preview');

  const activePdfSource = pdfUrl || (pdfBase64 ? `data:application/pdf;base64,${pdfBase64}` : undefined);

  const handleDownloadPdf = () => {
    if (!activePdfSource) return;
    const downloadLink = document.createElement('a');
    downloadLink.href = activePdfSource;
    downloadLink.download = pdfFilename;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const handleDownloadDocx = () => {
    if (!normalizedDocxBlob) return;
    const url = URL.createObjectURL(normalizedDocxBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Normalized_${diagnostic.filename}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyText = async () => {
    if (!extractedText) return;
    try {
      await navigator.clipboard.writeText(extractedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full flex flex-col space-y-3.5">
      {/* Action & Verification Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3.5 rounded-xl border border-[#37352F]/15 dark:border-white/15 bg-[#F7F6F3] dark:bg-[#202020] shadow-xs">
        {/* Status Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#0F7B6C]/10 text-[#0F7B6C] dark:bg-[#0F7B6C]/20 dark:text-[#2ecc71] text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Zero-Tofu Vector Stream</span>
          </span>
          <span className="text-xs text-[#787774] dark:text-[#9B9B9B] hidden sm:inline">
            1:1 WYSIWYG Chromium HarfBuzz
          </span>
          {isLoadingPdf && (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] bg-[#2383E2]/10 text-[#2383E2] animate-pulse">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Rendering PDF...</span>
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Zoom controls (desktop & tablet) */}
          <div className="hidden sm:flex items-center rounded-lg border border-[#37352F]/15 dark:border-white/15 bg-white dark:bg-[#191919] p-0.5 text-xs shadow-xs">
            <button
              onClick={() => setZoomLevel((z) => Math.max(z - 10, 60))}
              className="p-1.5 rounded hover:bg-[#37352F]/5 dark:hover:bg-white/5 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5 text-[#787774] dark:text-[#9B9B9B]" />
            </button>
            <span className="px-2 font-mono text-[11px] text-[#787774] dark:text-[#9B9B9B]">
              {zoomLevel}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(z + 10, 150))}
              className="p-1.5 rounded hover:bg-[#37352F]/5 dark:hover:bg-white/5 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5 text-[#787774] dark:text-[#9B9B9B]" />
            </button>
            <button
              onClick={() => setZoomLevel(100)}
              className="p-1.5 rounded hover:bg-[#37352F]/5 dark:hover:bg-white/5 transition-colors"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#787774] dark:text-[#9B9B9B]" />
            </button>
          </div>

          {/* Copy Clean Text */}
          {extractedText && (
            <button
              onClick={handleCopyText}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#37352F]/15 dark:border-white/15 bg-white dark:bg-[#191919] hover:bg-[#37352F]/5 dark:hover:bg-white/5 text-[#37352F] dark:text-[#D4D4D4] text-xs font-medium transition-colors shadow-xs"
              title="Copy extracted canonical Unicode text"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#0F7B6C]" />
                  <span className="text-[#0F7B6C]">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#787774]" />
                  <span className="hidden sm:inline">Copy Text</span>
                </>
              )}
            </button>
          )}

          {/* Download Normalized DOCX */}
          {normalizedDocxBlob && (
            <button
              onClick={handleDownloadDocx}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#37352F]/15 dark:border-white/15 bg-white dark:bg-[#191919] hover:bg-[#37352F]/5 dark:hover:bg-white/5 text-[#37352F] dark:text-[#D4D4D4] text-xs font-medium transition-colors shadow-xs"
              title="Download font-normalized DOCX with OpenType font mappings"
            >
              <FileDown className="w-3.5 h-3.5 text-[#2383E2]" />
              <span className="hidden sm:inline">Cleaned DOCX</span>
            </button>
          )}

          {/* Browser Print */}
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#37352F]/15 dark:border-white/15 bg-white dark:bg-[#191919] hover:bg-[#37352F]/5 dark:hover:bg-white/5 text-[#37352F] dark:text-[#D4D4D4] text-xs font-medium transition-colors shadow-xs"
            title="Instant Print / Save as PDF using your browser engine"
          >
            <Printer className="w-3.5 h-3.5 text-[#787774]" />
            <span className="hidden sm:inline">Print</span>
          </button>

          {/* Download PDF Primary Action */}
          <button
            onClick={handleDownloadPdf}
            disabled={!activePdfSource || isLoadingPdf}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#2383E2] hover:bg-[#1f73c7] text-white text-xs font-medium shadow-xs transition-colors disabled:opacity-50 min-h-[32px]"
          >
            {isLoadingPdf ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* Mobile Tab Switcher (< lg screens) */}
      <div className="flex lg:hidden rounded-lg border border-[#37352F]/15 dark:border-white/15 bg-[#F7F6F3] dark:bg-[#202020] p-1 text-xs">
        <button
          onClick={() => setMobileTab('preview')}
          className={`flex-1 py-1.5 rounded-md font-medium text-center transition-colors flex items-center justify-center gap-1.5 ${
            mobileTab === 'preview'
              ? 'bg-white dark:bg-[#191919] text-[#37352F] dark:text-white shadow-xs'
              : 'text-[#787774] dark:text-[#9B9B9B]'
          }`}
        >
          <Eye className="w-3.5 h-3.5 text-[#2383E2]" />
          <span>Document Preview</span>
        </button>
        <button
          onClick={() => setMobileTab('pdf')}
          className={`flex-1 py-1.5 rounded-md font-medium text-center transition-colors flex items-center justify-center gap-1.5 ${
            mobileTab === 'pdf'
              ? 'bg-white dark:bg-[#191919] text-[#37352F] dark:text-white shadow-xs'
              : 'text-[#787774] dark:text-[#9B9B9B]'
          }`}
        >
          <FileCheck className="w-3.5 h-3.5 text-[#0F7B6C]" />
          <span>PDF Viewer</span>
        </button>
      </div>

      {/* Split-Screen Panes (Side-by-Side on desktop lg:, Tabbed on mobile) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[550px] sm:h-[650px]">
        {/* Left Pane: Extracted Structure & Live Indic Web Font Typography */}
        <div
          className={`flex flex-col rounded-xl border border-[#37352F]/15 dark:border-white/15 bg-white dark:bg-[#191919] overflow-hidden shadow-xs ${
            mobileTab === 'preview' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          <div className="flex items-center justify-between px-4 py-2.5 bg-[#F7F6F3] dark:bg-[#202020] border-b border-[#37352F]/10 dark:border-white/10 text-xs">
            <div className="flex items-center gap-2">
              <Eye className="w-3.5 h-3.5 text-[#2383E2]" />
              <span className="font-semibold text-[#37352F] dark:text-[#D4D4D4]">
                Extracted Document Structure & Live CTL
              </span>
            </div>
            <span className="text-[11px] text-[#787774] dark:text-[#9B9B9B]">
              Noto Indic Fonts (400 / 700)
            </span>
          </div>
          <div className="flex-1 overflow-auto p-4 sm:p-6 bg-white dark:bg-[#191919]">
            <div
              style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top left' }}
              className="transition-transform duration-100 max-w-full prose prose-sm dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          </div>
        </div>

        {/* Right Pane: Generated PDF Stream / Vector Inspection */}
        <div
          className={`flex flex-col rounded-xl border border-[#37352F]/15 dark:border-white/15 bg-white dark:bg-[#191919] overflow-hidden shadow-xs ${
            mobileTab === 'pdf' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          <div className="flex items-center justify-between px-4 py-2.5 bg-[#F7F6F3] dark:bg-[#202020] border-b border-[#37352F]/10 dark:border-white/10 text-xs">
            <div className="flex items-center gap-2">
              <FileCheck className="w-3.5 h-3.5 text-[#0F7B6C]" />
              <span className="font-semibold text-[#37352F] dark:text-[#D4D4D4]">
                Generated 1:1 Document PDF
              </span>
            </div>
            <span className="text-[11px] text-[#0F7B6C] font-mono">
              Word Layout &middot; Zero Tofu
            </span>
          </div>

          <div className="flex-1 overflow-hidden bg-[#525659]/10 relative flex items-center justify-center">
            {activePdfSource ? (
              <iframe
                src={`${activePdfSource}#toolbar=0&navpanes=0`}
                className="w-full h-full border-0"
                title="LangCraft PDF Preview"
              />
            ) : isLoadingPdf ? (
              <div className="flex flex-col items-center justify-center space-y-3 p-6 text-center text-xs text-[#787774]">
                <Loader2 className="w-8 h-8 animate-spin text-[#2383E2]" />
                <p className="font-medium text-[#37352F] dark:text-white">
                  Shaping Complex Indic Glyphs & Rendering Vector PDF...
                </p>
                <p className="text-[11px] text-[#787774] dark:text-[#9B9B9B] max-w-xs">
                  Executing HarfBuzz GSUB/GPOS OpenType layout in headless Chromium.
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center space-y-2 p-6 text-center text-xs text-[#787774]">
                <FileCheck className="w-8 h-8 opacity-40 text-[#0F7B6C]" />
                <p>PDF vector preview will render here once conversion completes.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

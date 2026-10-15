'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface DropzoneProps {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
  onLoadSample: (sampleScript: 'Hindi' | 'Sanskrit' | 'Kannada' | 'Telugu' | 'Tamil' | 'Mixed') => void;
}

export const Dropzone: React.FC<DropzoneProps> = ({
  onFileSelect,
  isLoading,
  onLoadSample,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndProcess = async (file: File) => {
    setValidationError(null);

    // 1. Check extension
    if (!file.name.toLowerCase().endsWith('.docx')) {
      setValidationError('Invalid file format. Please upload a Microsoft Word (.docx) document.');
      return;
    }

    // 2. Check file size (max 25 MB)
    if (file.size > 25 * 1024 * 1024) {
      setValidationError('File size exceeds 25 MB limit.');
      return;
    }

    // 3. Client-side Magic-Byte Check (PK\x03\x04)
    try {
      const headerBytes = new Uint8Array(await file.slice(0, 4).arrayBuffer());
      const isZip =
        headerBytes[0] === 0x50 &&
        headerBytes[1] === 0x4b &&
        (headerBytes[2] === 0x03 || headerBytes[2] === 0x05 || headerBytes[2] === 0x07) &&
        (headerBytes[3] === 0x04 || headerBytes[3] === 0x06 || headerBytes[3] === 0x08);

      if (!isZip) {
        setValidationError('File header corrupted. Missing valid PKZIP signature bytes.');
        return;
      }
    } catch {
      setValidationError('Unable to inspect file headers.');
      return;
    }

    onFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file) {
        validateAndProcess(file);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file) {
        validateAndProcess(file);
      }
    }
  };

  return (
    <div className="w-full space-y-3">
      {/* Notion Callout Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isLoading && fileInputRef.current?.click()}
        className={`group relative cursor-pointer rounded-lg border transition-all duration-200 p-8 text-center ${
          isDragOver
            ? 'border-[#2383E2] bg-[#2383E2]/5 dark:bg-[#2383E2]/10 scale-[1.005]'
            : 'border-[#37352F]/15 dark:border-white/15 bg-[#F7F6F3] dark:bg-[#202020] hover:border-[#37352F]/30 hover:bg-[#EFEFED] dark:hover:bg-[#262626]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".docx"
          onChange={handleFileChange}
          className="hidden"
          disabled={isLoading}
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white dark:bg-[#191919] border border-[#37352F]/10 dark:border-white/10 shadow-sm group-hover:scale-105 transition-transform">
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-[#2383E2]" />
            ) : (
              <UploadCloud className="h-6 w-6 text-[#37352F] dark:text-[#D4D4D4]" />
            )}
          </div>

          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-[#37352F] dark:text-[#D4D4D4]">
              {isLoading
                ? 'Parsing OOXML & Shaping Indic Glyphs...'
                : 'Drop Microsoft Word (.docx) document here, or browse'}
            </h3>
            <p className="text-xs text-[#787774] dark:text-[#9B9B9B] max-w-md mx-auto">
              Automated font substitution for Mangal, Tunga, Gautami, Latha & Kokila.
              Complex script HarfBuzz layout with zero `.notdef` tofu guarantee.
            </p>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-[11px]">
            <span className="inline-flex items-center gap-1 rounded bg-white dark:bg-[#191919] px-2 py-0.5 border border-[#37352F]/10 dark:border-white/10 text-[#787774] dark:text-[#9B9B9B] font-mono">
              <FileText className="w-3 h-3 text-[#2383E2]" /> .docx OOXML
            </span>
            <span className="inline-flex items-center gap-1 rounded bg-white dark:bg-[#191919] px-2 py-0.5 border border-[#37352F]/10 dark:border-white/10 text-[#787774] dark:text-[#9B9B9B]">
              Max 25 MB
            </span>
            <span className="inline-flex items-center gap-1 rounded bg-[#0F7B6C]/10 text-[#0F7B6C] px-2 py-0.5 font-medium">
              <CheckCircle className="w-3 h-3" /> HarfBuzz GSUB/GPOS Ready
            </span>
          </div>
        </div>
      </div>

      {/* Validation Error Message */}
      {validationError && (
        <div className="flex items-center gap-2 p-3 text-xs rounded-md bg-[#E03E3E]/10 border border-[#E03E3E]/20 text-[#E03E3E]">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Instant Test Samples Bar */}
      <div className="flex items-center justify-between px-2 pt-1">
        <span className="text-[11px] text-[#787774] dark:text-[#9B9B9B] font-medium uppercase tracking-wider">
          Quick Test Sample Generator:
        </span>
        <div className="flex flex-wrap items-center gap-1.5">
          {(['Hindi', 'Sanskrit', 'Kannada', 'Telugu', 'Tamil', 'Mixed'] as const).map(
            (script) => (
              <button
                key={script}
                onClick={(e) => {
                  e.stopPropagation();
                  onLoadSample(script);
                }}
                disabled={isLoading}
                className="text-[11px] px-2 py-1 rounded bg-[#37352F]/5 dark:bg-white/5 hover:bg-[#37352F]/10 dark:hover:bg-white/10 text-[#37352F] dark:text-[#D4D4D4] font-medium transition-colors"
              >
                {script}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
};

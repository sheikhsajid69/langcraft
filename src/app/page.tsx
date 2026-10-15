'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Topbar } from '@/components/Topbar';
import { Dropzone } from '@/components/Dropzone';
import { DiagnosticTable } from '@/components/DiagnosticTable';
import { FontRegistryModal } from '@/components/FontRegistryModal';
import { PreviewSplitView } from '@/components/PreviewSplitView';
import { DocumentDiagnostic, ConversionResponse, IndicScript } from '@/types';
import { Sparkles, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function Home() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedScriptFilter, setSelectedScriptFilter] = useState<IndicScript | 'All'>('All');
  const [isFontRegistryOpen, setIsFontRegistryOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [diagnostic, setDiagnostic] = useState<DocumentDiagnostic | null>(null);
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [pdfBase64, setPdfBase64] = useState<string | undefined>(undefined);
  const [pdfFilename, setPdfFilename] = useState<string>('langcraft-output.pdf');

  const [conversionHistory, setConversionHistory] = useState<
    Array<{
      id: string;
      filename: string;
      timestamp: string;
      script: string;
      status: 'Verified' | 'Error';
    }>
  >([]);

  // Keyboard shortcut Ctrl+\ to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '\\') {
        e.preventDefault();
        setIsSidebarOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleToggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return next;
    });
  };

  const handleReset = () => {
    setDiagnostic(null);
    setHtmlContent(null);
    setPdfBase64(undefined);
    setError(null);
  };

  const processFile = async (file: File) => {
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (selectedScriptFilter !== 'All') {
        formData.append('targetScript', selectedScriptFilter);
      }

      const res = await fetch('/api/convert', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({ error: 'Conversion failed' }));
        throw new Error(errJson.error || `Server responded with status ${res.status}`);
      }

      const data: ConversionResponse = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Conversion encountered an error');
      }

      setDiagnostic(data.diagnostic);
      setHtmlContent(data.htmlContent);
      setPdfBase64(data.pdfBase64);
      setPdfFilename(data.pdfFilename || `${file.name.replace(/\.docx$/i, '')}-langcraft.pdf`);

      setConversionHistory((prev) => [
        {
          id: Math.random().toString(36).substring(2, 9),
          filename: file.name,
          timestamp: new Date().toLocaleTimeString(),
          script: data.diagnostic.primaryScript,
          status: 'Verified',
        },
        ...prev.slice(0, 9),
      ]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown conversion error';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadSample = async (sampleScript: 'Hindi' | 'Sanskrit' | 'Kannada' | 'Telugu' | 'Tamil' | 'Mixed') => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/convert?sample=${sampleScript.toLowerCase()}`, {
        method: 'GET',
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({ error: 'Sample generation failed' }));
        throw new Error(errJson.error || `Server error ${res.status}`);
      }

      const data: ConversionResponse = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Sample conversion error');
      }

      setDiagnostic(data.diagnostic);
      setHtmlContent(data.htmlContent);
      setPdfBase64(data.pdfBase64);
      setPdfFilename(data.pdfFilename || `sample-${sampleScript.toLowerCase()}.pdf`);

      setConversionHistory((prev) => [
        {
          id: Math.random().toString(36).substring(2, 9),
          filename: `Sample_${sampleScript}.docx`,
          timestamp: new Date().toLocaleTimeString(),
          script: data.diagnostic.primaryScript,
          status: 'Verified',
        },
        ...prev.slice(0, 9),
      ]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error generating sample';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white dark:bg-[#191919] text-[#37352F] dark:text-[#D4D4D4]">
      {/* Notion Collapsible Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen((prev) => !prev)}
        selectedScriptFilter={selectedScriptFilter}
        onSelectScriptFilter={setSelectedScriptFilter}
        onOpenFontRegistry={() => setIsFontRegistryOpen(true)}
        conversionHistory={conversionHistory}
      />

      {/* Main Workspace Canvas */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ease-in-out ${
          isSidebarOpen ? 'pl-64' : 'pl-0'
        }`}
      >
        <Topbar
          selectedScriptFilter={selectedScriptFilter}
          onOpenFontRegistry={() => setIsFontRegistryOpen(true)}
          onReset={handleReset}
          isDarkMode={isDarkMode}
          onToggleDarkMode={handleToggleDarkMode}
        />

        <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-8">
          {/* Page Title & Callout Header */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-3xl">📜</span>
              <h1 className="text-2xl font-bold tracking-tight text-[#37352F] dark:text-white">
                Indic DOCX to Zero-Tofu PDF Engine
              </h1>
            </div>
            <p className="text-xs text-[#787774] dark:text-[#9B9B9B] max-w-3xl leading-relaxed">
              LangCraft eliminates the empty box (<code className="font-mono text-[#D9730D]">.notdef</code> /{' '}
              <code className="font-mono text-[#D9730D]">\uFFFD</code>) corruption common in Microsoft Word
              DOCX exports by parsing OOXML run fonts, normalizing legacy ASCII encodings, and embedding
              OpenType HarfBuzz-shaped Google Noto font subsets for Hindi, Kannada, Telugu, Tamil, and Sanskrit.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-[#E03E3E]/10 border border-[#E03E3E]/20 text-[#E03E3E] text-xs">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <div>
                <p className="font-semibold">Conversion Error Encountered</p>
                <p>{error}</p>
              </div>
            </div>
          )}

          {/* Upload Callout Dropzone */}
          <Dropzone
            onFileSelect={processFile}
            isLoading={isLoading}
            onLoadSample={handleLoadSample}
          />

          {/* Document Diagnostic Database View */}
          {diagnostic && (
            <div className="space-y-3">
              <DiagnosticTable diagnostic={diagnostic} />
            </div>
          )}

          {/* Split-Screen Live Preview & Export Bar */}
          {diagnostic && htmlContent && (
            <div className="space-y-3">
              <PreviewSplitView
                htmlContent={htmlContent}
                pdfBase64={pdfBase64}
                pdfFilename={pdfFilename}
                diagnostic={diagnostic}
              />
            </div>
          )}
        </main>
      </div>

      {/* Font Registry Modal */}
      <FontRegistryModal
        isOpen={isFontRegistryOpen}
        onClose={() => setIsFontRegistryOpen(false)}
      />
    </div>
  );
}

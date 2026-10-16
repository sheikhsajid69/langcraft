'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Sidebar } from '@/components/Sidebar';
import { Topbar } from '@/components/Topbar';
import { Dropzone } from '@/components/Dropzone';
import { DiagnosticTable } from '@/components/DiagnosticTable';
import { FontRegistryModal } from '@/components/FontRegistryModal';
import { PreviewSplitView } from '@/components/PreviewSplitView';
import { DocumentDiagnostic, IndicScript } from '@/types';
import { ShieldAlert } from 'lucide-react';

export default function Home() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedScriptFilter, setSelectedScriptFilter] = useState<IndicScript | 'All'>('All');
  const [isFontRegistryOpen, setIsFontRegistryOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [diagnostic, setDiagnostic] = useState<DocumentDiagnostic | null>(null);
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | undefined>(undefined);
  const [pdfFilename, setPdfFilename] = useState<string>('langcraft-output.pdf');

  const activePdfUrlRef = useRef<string | undefined>(undefined);

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

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (activePdfUrlRef.current) {
        URL.revokeObjectURL(activePdfUrlRef.current);
      }
    };
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
    if (activePdfUrlRef.current) {
      URL.revokeObjectURL(activePdfUrlRef.current);
      activePdfUrlRef.current = undefined;
    }
    setDiagnostic(null);
    setHtmlContent(null);
    setPdfUrl(undefined);
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

      // Step 1: Query /api/inspect for diagnostic metadata
      const inspectRes = await fetch('/api/inspect', {
        method: 'POST',
        body: formData,
      });

      if (!inspectRes.ok) {
        const errJson = await inspectRes.json().catch(() => ({ error: 'Inspection failed' }));
        throw new Error(errJson.error || `Inspection error (HTTP ${inspectRes.status})`);
      }

      const inspectData = await inspectRes.json();
      if (!inspectData.success) {
        throw new Error(inspectData.error || 'Document inspection failed');
      }

      setDiagnostic(inspectData.diagnostic);
      setHtmlContent(inspectData.htmlContent);

      // Step 2: Query /api/convert for true 1:1 vector PDF binary stream
      const convertRes = await fetch('/api/convert', {
        method: 'POST',
        body: formData,
      });

      if (!convertRes.ok) {
        const errJson = await convertRes.json().catch(() => ({ error: 'Conversion failed' }));
        throw new Error(errJson.error || `Conversion error (HTTP ${convertRes.status})`);
      }

      const pdfBlob = await convertRes.blob();

      // Revoke old object URL
      if (activePdfUrlRef.current) {
        URL.revokeObjectURL(activePdfUrlRef.current);
      }

      const newPdfUrl = URL.createObjectURL(pdfBlob);
      activePdfUrlRef.current = newPdfUrl;
      setPdfUrl(newPdfUrl);

      const targetFilename = `${file.name.replace(/\.docx$/i, '')}.pdf`;
      setPdfFilename(targetFilename);

      setConversionHistory((prev) => [
        {
          id: Math.random().toString(36).substring(2, 9),
          filename: file.name,
          timestamp: new Date().toLocaleTimeString(),
          script: inspectData.diagnostic.primaryScript,
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

  const handleLoadSample = async (
    sampleScript: 'Hindi' | 'Sanskrit' | 'Kannada' | 'Telugu' | 'Tamil' | 'Mixed'
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Inspect sample metadata
      const inspectRes = await fetch(`/api/inspect?sample=${sampleScript.toLowerCase()}`, {
        method: 'GET',
      });

      if (!inspectRes.ok) {
        const errJson = await inspectRes.json().catch(() => ({ error: 'Sample inspect failed' }));
        throw new Error(errJson.error || `Sample inspect error (HTTP ${inspectRes.status})`);
      }

      const inspectData = await inspectRes.json();
      if (!inspectData.success) {
        throw new Error(inspectData.error || 'Sample inspect failed');
      }

      setDiagnostic(inspectData.diagnostic);
      setHtmlContent(inspectData.htmlContent);

      // Step 2: Convert sample to 1:1 PDF binary
      const convertRes = await fetch(`/api/convert?sample=${sampleScript.toLowerCase()}`, {
        method: 'GET',
      });

      if (!convertRes.ok) {
        const errJson = await convertRes.json().catch(() => ({ error: 'Sample conversion failed' }));
        throw new Error(errJson.error || `Sample convert error (HTTP ${convertRes.status})`);
      }

      const pdfBlob = await convertRes.blob();

      if (activePdfUrlRef.current) {
        URL.revokeObjectURL(activePdfUrlRef.current);
      }

      const newPdfUrl = URL.createObjectURL(pdfBlob);
      activePdfUrlRef.current = newPdfUrl;
      setPdfUrl(newPdfUrl);

      const targetFilename = `Sample_${sampleScript}.pdf`;
      setPdfFilename(targetFilename);

      setConversionHistory((prev) => [
        {
          id: Math.random().toString(36).substring(2, 9),
          filename: `Sample_${sampleScript}.docx`,
          timestamp: new Date().toLocaleTimeString(),
          script: inspectData.diagnostic.primaryScript,
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
          isSidebarOpen ? 'pl-60' : 'pl-0'
        }`}
      >
        <Topbar
          selectedScriptFilter={selectedScriptFilter}
          onOpenFontRegistry={() => setIsFontRegistryOpen(true)}
          onReset={handleReset}
          isDarkMode={isDarkMode}
          onToggleDarkMode={handleToggleDarkMode}
        />

        <main className="flex-1 w-full max-w-5xl mx-auto space-y-8 px-6 py-10 md:px-12">
          {/* Page Title & Callout Header */}
          <header className="space-y-3">
            <Image
              src="/Epic-Elephant-langcraft.png"
              alt="LangCraft"
              width={72}
              height={72}
              className="h-[72px] w-[72px] rounded-lg border border-black/5 shadow-sm dark:border-white/10"
            />
            <h1 className="text-3xl font-bold tracking-tight text-[#37352F] dark:text-white sm:text-4xl">
              Indic DOCX-to-PDF Converter
            </h1>
            <p className="max-w-3xl text-xs leading-relaxed text-[#787774] dark:text-[#9B9B9B]">
              LangCraft eliminates the empty box (<code className="font-mono text-[#D9730D]">.notdef</code> /{' '}
              <code className="font-mono text-[#D9730D]">\uFFFD</code>) corruption common in Microsoft Word
              DOCX exports by parsing OOXML run fonts, normalizing legacy ASCII encodings, and embedding
              OpenType HarfBuzz-shaped Google Noto font subsets for Hindi, Kannada, Telugu, Tamil, and Sanskrit.
            </p>
          </header>

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
                pdfUrl={pdfUrl}
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

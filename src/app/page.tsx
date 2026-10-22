'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Sidebar } from '@/components/Sidebar';
import { Topbar } from '@/components/Topbar';
import { Dropzone } from '@/components/Dropzone';
import { DiagnosticTable } from '@/components/DiagnosticTable';
import { FontRegistryModal } from '@/components/FontRegistryModal';
import { PreviewSplitView } from '@/components/PreviewSplitView';
import { Footer } from '@/components/Footer';
import { DocumentDiagnostic, IndicScript } from '@/types';
import { normalizeDocxBuffer } from '@/lib/docx-processor';
import { ShieldAlert, AlertCircle, RefreshCw } from 'lucide-react';

export default function Home() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedScriptFilter, setSelectedScriptFilter] = useState<IndicScript | 'All'>('All');
  const [isFontRegistryOpen, setIsFontRegistryOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [diagnostic, setDiagnostic] = useState<DocumentDiagnostic | null>(null);
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string | undefined>(undefined);
  const [normalizedDocxBlob, setNormalizedDocxBlob] = useState<Blob | undefined>(undefined);
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

  // Automatically open sidebar on desktop screens (>= 768px), keep closed on mobile
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      setIsSidebarOpen(true);
    }
  }, []);

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
    setExtractedText(undefined);
    setNormalizedDocxBlob(undefined);
    setPdfUrl(undefined);
    setError(null);
    setIsLoading(false);
    setIsLoadingPdf(false);
  };

  /**
   * Resilient dual-mode document processor:
   * 1. Instant client-side OOXML normalization and diagnostic extraction (<50ms).
   * 2. Background HarfBuzz vector PDF rendering via /api/convert.
   */
  const processFile = async (file: File) => {
    setIsLoading(true);
    setIsLoadingPdf(true);
    setError(null);

    const targetPdfName = `${file.name.replace(/\.docx$/i, '')}.pdf`;
    setPdfFilename(targetPdfName);

    let clientDiagnostic: DocumentDiagnostic | null = null;

    try {
      // Step 1: Instant Client-Side Parsing & Diagnostic Extraction
      const arrayBuffer = await file.arrayBuffer();
      try {
        const localParsed = await normalizeDocxBuffer(arrayBuffer, file.name);
        clientDiagnostic = localParsed.diagnostic;
        setDiagnostic(localParsed.diagnostic);
        setHtmlContent(localParsed.htmlContent);
        setExtractedText(localParsed.extractedText);

        const cleanBlob = new Blob([localParsed.normalizedBuffer as unknown as BlobPart], {
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        });
        setNormalizedDocxBlob(cleanBlob);
      } catch (clientParseErr) {
        console.warn('Client-side fast parse note:', clientParseErr);
      }

      // Step 2: Prepare FormData for server conversion
      const formData = new FormData();
      formData.append('file', file);
      if (selectedScriptFilter !== 'All') {
        formData.append('targetScript', selectedScriptFilter);
      }

      // If client-side parse failed, fallback to /api/inspect
      if (!clientDiagnostic) {
        try {
          const inspectRes = await fetch('/api/inspect', {
            method: 'POST',
            body: formData,
          });

          if (inspectRes.ok) {
            const inspectData = await inspectRes.json();
            if (inspectData.success && inspectData.diagnostic) {
              clientDiagnostic = inspectData.diagnostic;
              setDiagnostic(inspectData.diagnostic);
              setHtmlContent(inspectData.htmlContent);
            }
          }
        } catch (inspectNetErr) {
          console.warn('Inspect fallback fetch warning:', inspectNetErr);
        }
      }

      // Initial loading finished (UI displays diagnostic and preview immediately)
      setIsLoading(false);

      // Step 3: Server-side Headless Chromium HarfBuzz PDF Conversion
      const convertRes = await fetch('/api/convert', {
        method: 'POST',
        body: formData,
      });

      if (!convertRes.ok) {
        let errMsg = `PDF rendering error (HTTP ${convertRes.status})`;
        try {
          const errJson = await convertRes.json();
          if (errJson.error) errMsg = errJson.error;
        } catch {
          if (convertRes.status === 502 || convertRes.status === 504 || convertRes.status === 503) {
            errMsg =
              'The PDF rendering server is starting up or temporarily busy. Your document is fully inspected and viewable below; please retry conversion in a few moments.';
          }
        }
        throw new Error(errMsg);
      }

      const pdfBlob = await convertRes.blob();

      // Revoke old object URL
      if (activePdfUrlRef.current) {
        URL.revokeObjectURL(activePdfUrlRef.current);
      }

      const newPdfUrl = URL.createObjectURL(pdfBlob);
      activePdfUrlRef.current = newPdfUrl;
      setPdfUrl(newPdfUrl);

      setConversionHistory((prev) => [
        {
          id: Math.random().toString(36).substring(2, 9),
          filename: file.name,
          timestamp: new Date().toLocaleTimeString(),
          script: clientDiagnostic?.primaryScript || 'Indic',
          status: 'Verified',
        },
        ...prev.slice(0, 9),
      ]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown conversion error';
      setError(msg);
    } finally {
      setIsLoading(false);
      setIsLoadingPdf(false);
    }
  };

  /**
   * Loads a bundled pre-configured Indic benchmark sample
   */
  const handleLoadSample = async (
    sampleScript: 'Hindi' | 'Sanskrit' | 'Kannada' | 'Telugu' | 'Tamil' | 'Mixed'
  ) => {
    setIsLoading(true);
    setIsLoadingPdf(true);
    setError(null);

    try {
      // Step 1: Inspect sample metadata
      const inspectRes = await fetch(`/api/inspect?sample=${sampleScript.toLowerCase()}`, {
        method: 'GET',
      });

      let inspectData: any = null;
      if (inspectRes.ok) {
        inspectData = await inspectRes.json();
      } else {
        let inspectErrMsg = `Sample inspect error (HTTP ${inspectRes.status})`;
        try {
          const errJson = await inspectRes.json();
          if (errJson.error) inspectErrMsg = errJson.error;
        } catch {
          // ignore
        }
        throw new Error(inspectErrMsg);
      }

      if (!inspectData?.success) {
        throw new Error(inspectData?.error || 'Sample inspect failed');
      }

      setDiagnostic(inspectData.diagnostic);
      setHtmlContent(inspectData.htmlContent);
      setIsLoading(false);

      // Step 2: Convert sample to 1:1 PDF binary
      const convertRes = await fetch(`/api/convert?sample=${sampleScript.toLowerCase()}`, {
        method: 'GET',
      });

      if (!convertRes.ok) {
        let convertErrMsg = `Sample convert error (HTTP ${convertRes.status})`;
        try {
          const errJson = await convertRes.json();
          if (errJson.error) convertErrMsg = errJson.error;
        } catch {
          // ignore
        }
        throw new Error(convertErrMsg);
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
      setIsLoadingPdf(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#191919] text-[#37352F] dark:text-[#D4D4D4]">
      {/* Notion Collapsible Sidebar with Mobile Backdrop */}
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen((prev) => !prev)}
        selectedScriptFilter={selectedScriptFilter}
        onSelectScriptFilter={setSelectedScriptFilter}
        onOpenFontRegistry={() => setIsFontRegistryOpen(true)}
        conversionHistory={conversionHistory}
      />

      {/* Main Workspace Canvas (Responsive md:pl-60 offset) */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ease-in-out ${
          isSidebarOpen ? 'md:pl-60' : 'pl-0'
        }`}
      >
        <Topbar
          selectedScriptFilter={selectedScriptFilter}
          onOpenFontRegistry={() => setIsFontRegistryOpen(true)}
          onReset={handleReset}
          isDarkMode={isDarkMode}
          onToggleDarkMode={handleToggleDarkMode}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        />

        <main className="flex-1 w-full max-w-5xl mx-auto space-y-6 sm:space-y-8 px-4 sm:px-6 md:px-12 py-6 sm:py-10">
          {/* Notion Page Header Emblem & Workspace Title */}
          <header className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <Image
                src="/logo.png"
                alt="LangCraft Logo"
                width={72}
                height={72}
                priority
                className="h-14 w-14 sm:h-[72px] sm:w-[72px] rounded-xl border border-black/5 shadow-sm dark:border-white/10 shrink-0"
              />
              {diagnostic && (
                <button
                  onClick={handleReset}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-[#787774] hover:text-[#37352F] dark:text-[#9B9B9B] dark:hover:text-[#D4D4D4] hover:bg-[#37352F]/5 dark:hover:bg-white/5 transition-colors border border-[#37352F]/10 dark:border-white/10"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>New Document</span>
                </button>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-[#37352F] dark:text-white">
              Indic DOCX-to-PDF Converter
            </h1>
            <p className="max-w-3xl text-xs sm:text-sm leading-relaxed text-[#787774] dark:text-[#9B9B9B]">
              LangCraft eliminates the empty box (<code className="font-mono text-[#D9730D]">.notdef</code> /{' '}
              <code className="font-mono text-[#D9730D]">\uFFFD</code>) corruption common in Microsoft Word
              DOCX exports by parsing OOXML run fonts, normalizing legacy ASCII encodings, and embedding
              OpenType HarfBuzz-shaped Google Noto font subsets for Hindi, Kannada, Telugu, Tamil, and Sanskrit.
            </p>
          </header>

          {/* Error Banner */}
          {error && (
            <div className="flex items-start gap-3 p-3.5 sm:p-4 rounded-lg bg-[#E03E3E]/10 border border-[#E03E3E]/20 text-[#E03E3E] text-xs leading-relaxed animate-in fade-in duration-200">
              <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 mt-0.5" />
              <div className="space-y-1 min-w-0 flex-1">
                <p className="font-semibold">Notice</p>
                <p className="break-words">{error}</p>
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
                normalizedDocxBlob={normalizedDocxBlob}
                extractedText={extractedText}
                isLoadingPdf={isLoadingPdf}
              />
            </div>
          )}
        </main>

        {/* Developer Attribution & Socials Footer */}
        <Footer onOpenFontRegistry={() => setIsFontRegistryOpen(true)} />
      </div>

      {/* Font Registry Modal */}
      <FontRegistryModal
        isOpen={isFontRegistryOpen}
        onClose={() => setIsFontRegistryOpen(false)}
      />
    </div>
  );
}

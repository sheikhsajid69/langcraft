'use client';

import React from 'react';
import Image from 'next/image';
import {
  Github,
  Linkedin,
  Twitter,
  Globe,
  Mail,
  ExternalLink,
  ShieldCheck,
  Cpu,
  Layers,
  Heart,
} from 'lucide-react';

interface FooterProps {
  onOpenFontRegistry?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenFontRegistry }) => {
  return (
    <footer className="w-full border-t border-[#37352F]/10 dark:border-white/10 bg-[#F7F6F3]/50 dark:bg-[#191919]/50 mt-16 text-xs text-[#787774] dark:text-[#9B9B9B] transition-colors">
      <div className="max-w-5xl mx-auto px-6 py-10 md:px-12 space-y-8">
        {/* Top Section: Developer Profile & Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6 border-b border-[#37352F]/10 dark:border-white/10">
          {/* Brand & Creator Bio */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <Image
                src="/logo.png"
                alt="LangCraft Logo"
                width={28}
                height={28}
                className="h-7 w-7 rounded-lg border border-black/5 shadow-sm dark:border-white/10"
              />
              <span className="font-semibold text-sm tracking-tight text-[#37352F] dark:text-[#D4D4D4]">
                LangCraft
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#0F7B6C]/10 text-[#0F7B6C] font-medium">
                v1.0.0
              </span>
            </div>
            <p className="text-[11px] leading-relaxed text-[#787774] dark:text-[#9B9B9B]">
              Production-grade Indic DOCX-to-PDF conversion engine. Eliminates tofu glyph corruptions
              across Devanagari, Kannada, Telugu, and Tamil scripts using native HarfBuzz CTL shaping.
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-[#37352F] dark:text-[#D4D4D4] font-medium">
              <span>Engineered with</span>
              <Heart className="w-3.5 h-3.5 text-[#E03E3E] fill-[#E03E3E]" />
              <span>by</span>
              <a
                href="https://sheikhsajid69.qzz.io"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-[#2383E2] hover:underline"
              >
                Sheikh Sajid
              </a>
            </div>
          </div>

          {/* Developer Socials & Profiles */}
          <div className="space-y-3 md:col-span-1">
            <h4 className="font-semibold text-[11px] uppercase tracking-wider text-[#37352F] dark:text-[#D4D4D4]">
              Developer Socials
            </h4>
            <div className="flex flex-col space-y-2 text-xs">
              <a
                href="https://github.com/sheikhsajid69"
                target="_blank"
                rel="noreferrer"
                className="group inline-flex items-center gap-2 text-[#37352F] dark:text-[#D4D4D4] hover:text-[#2383E2] dark:hover:text-[#2383E2] transition-colors"
              >
                <div className="p-1 rounded bg-[#37352F]/5 dark:bg-white/5 group-hover:bg-[#2383E2]/10 transition-colors">
                  <Github className="w-3.5 h-3.5" />
                </div>
                <span>github.com/sheikhsajid69</span>
                <ExternalLink className="w-2.5 h-2.5 opacity-50 group-hover:opacity-100" />
              </a>

              <a
                href="https://sheikhsajid69.qzz.io"
                target="_blank"
                rel="noreferrer"
                className="group inline-flex items-center gap-2 text-[#37352F] dark:text-[#D4D4D4] hover:text-[#2383E2] dark:hover:text-[#2383E2] transition-colors"
              >
                <div className="p-1 rounded bg-[#37352F]/5 dark:bg-white/5 group-hover:bg-[#2383E2]/10 transition-colors">
                  <Globe className="w-3.5 h-3.5" />
                </div>
                <span>sheikhsajid69.qzz.io (Portfolio)</span>
                <ExternalLink className="w-2.5 h-2.5 opacity-50 group-hover:opacity-100" />
              </a>

              <a
                href="https://linkedin.com/in/sheikhsajid69"
                target="_blank"
                rel="noreferrer"
                className="group inline-flex items-center gap-2 text-[#37352F] dark:text-[#D4D4D4] hover:text-[#2383E2] dark:hover:text-[#2383E2] transition-colors"
              >
                <div className="p-1 rounded bg-[#37352F]/5 dark:bg-white/5 group-hover:bg-[#2383E2]/10 transition-colors">
                  <Linkedin className="w-3.5 h-3.5" />
                </div>
                <span>linkedin.com/in/sheikhsajid69</span>
                <ExternalLink className="w-2.5 h-2.5 opacity-50 group-hover:opacity-100" />
              </a>

              <a
                href="https://x.com/SheikhSajid69"
                target="_blank"
                rel="noreferrer"
                className="group inline-flex items-center gap-2 text-[#37352F] dark:text-[#D4D4D4] hover:text-[#2383E2] dark:hover:text-[#2383E2] transition-colors"
              >
                <div className="p-1 rounded bg-[#37352F]/5 dark:bg-white/5 group-hover:bg-[#2383E2]/10 transition-colors">
                  <Twitter className="w-3.5 h-3.5" />
                </div>
                <span>x.com/SheikhSajid69</span>
                <ExternalLink className="w-2.5 h-2.5 opacity-50 group-hover:opacity-100" />
              </a>

              <a
                href="mailto:sheikhsajid.com@gmail.com"
                className="group inline-flex items-center gap-2 text-[#37352F] dark:text-[#D4D4D4] hover:text-[#2383E2] dark:hover:text-[#2383E2] transition-colors"
              >
                <div className="p-1 rounded bg-[#37352F]/5 dark:bg-white/5 group-hover:bg-[#2383E2]/10 transition-colors">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <span>sheikhsajid.com@gmail.com</span>
              </a>
            </div>
          </div>

          {/* Architecture & Typography Specs */}
          <div className="space-y-3 md:col-span-1">
            <h4 className="font-semibold text-[11px] uppercase tracking-wider text-[#37352F] dark:text-[#D4D4D4]">
              Typography Architecture
            </h4>
            <div className="space-y-2 text-[11px]">
              <div className="flex items-center gap-2 text-[#0F7B6C]">
                <Cpu className="w-3.5 h-3.5 shrink-0" />
                <span>HarfBuzz CTL (GSUB / GPOS) Engine</span>
              </div>
              <div className="flex items-center gap-2 text-[#2383E2]">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>Zero-Tofu Invariant (0 \uFFFD &middot; 0 .notdef)</span>
              </div>
              {onOpenFontRegistry && (
                <button
                  onClick={onOpenFontRegistry}
                  className="flex items-center gap-2 text-[#37352F] dark:text-[#D4D4D4] hover:text-[#2383E2] dark:hover:text-[#2383E2] transition-colors text-left"
                >
                  <Layers className="w-3.5 h-3.5 shrink-0" />
                  <span>View Font Substitution Matrix</span>
                </button>
              )}
              <div className="pt-2 text-[10px] text-[#787774] dark:text-[#9B9B9B] space-y-1">
                <p>Scripts: Hindi, Sanskrit, Kannada, Telugu, Tamil</p>
                <p>License: Apache 2.0 Open Source</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Repo */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#787774] dark:text-[#9B9B9B]">
          <div>
            &copy; {new Date().getFullYear()} LangCraft &middot; Engineered by{' '}
            <a
              href="https://sheikhsajid69.qzz.io"
              target="_blank"
              rel="noreferrer"
              className="text-[#37352F] dark:text-white font-medium hover:underline"
            >
              Sheikh Sajid
            </a>
            . Licensed under Apache 2.0.
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://github.com/sheikhsajid69/langcraft"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[#37352F] dark:hover:text-white transition-colors flex items-center gap-1"
            >
              <Github className="w-3.5 h-3.5" />
              <span>Source Repository</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

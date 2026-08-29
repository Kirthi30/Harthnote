import React from 'react';
import { ShieldCheck, Lock, Sparkles, Database, X, Check } from 'lucide-react';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#2B231F]/40 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-[#FFFDF9] border border-[#E8DFC8] rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl text-[#4A3F39] relative my-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#EFE7D8]">
          <div className="flex items-center space-x-2 text-[#4D7C5F]">
            <ShieldCheck className="w-5 h-5" />
            <h3 className="font-display font-semibold text-lg text-[#2B231F]">
              Privacy & Security Architecture
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#7C7067] hover:text-[#2B231F] hover:bg-[#EAE1CF]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 4 Plain-Language Pillars */}
        <div className="space-y-4 text-xs">
          {/* Pillar 1: Firestore Isolation */}
          <div className="p-4 rounded-2xl bg-[#F8F4EB] border border-[#E8DEC9] space-y-1.5">
            <div className="flex items-center space-x-2 font-bold text-[#2B231F]">
              <Database className="w-4 h-4 text-[#C97C4C]" />
              <span>1. Strict User Isolation (Cloud Firestore)</span>
            </div>
            <p className="text-[#665950] font-serif leading-relaxed">
              Every journal entry, mood log, and weekly reflection is stored under <code className="bg-[#EFE5D3] px-1 py-0.5 rounded text-[11px]">/users/{'{userId}'}/...</code>.
              Database security rules strictly enforce that no user can ever read, list, or query another person’s entries.
            </p>
          </div>

          {/* Pillar 2: Server-Side Gemini Calls */}
          <div className="p-4 rounded-2xl bg-[#F8F4EB] border border-[#E8DEC9] space-y-1.5">
            <div className="flex items-center space-x-2 font-bold text-[#2B231F]">
              <Sparkles className="w-4 h-4 text-[#4D7C5F]" />
              <span>2. Zero-Exposure AI Processing</span>
            </div>
            <p className="text-[#665950] font-serif leading-relaxed">
              All interactions with Gemini 3.6 Flash are strictly proxied through our secure backend API. Your API keys are never in the client browser, and you can switch AI Memory to <strong>None</strong> at any moment to disable AI entirely.
            </p>
          </div>

          {/* Pillar 3: Honest PIN Lock */}
          <div className="p-4 rounded-2xl bg-[#F8F4EB] border border-[#E8DEC9] space-y-1.5">
            <div className="flex items-center space-x-2 font-bold text-[#2B231F]">
              <Lock className="w-4 h-4 text-[#8A6D79]" />
              <span>3. Transparent PIN Screen Lock</span>
            </div>
            <p className="text-[#665950] font-serif leading-relaxed">
              The optional 4-digit PIN is designed as a client-side screen lock for visual privacy in public spaces (e.g. coffee shops or shared laptops). It prevents passersby from seeing open journal pages.
            </p>
          </div>

          {/* Pillar 4: You Own Your Data */}
          <div className="p-4 rounded-2xl bg-[#F8F4EB] border border-[#E8DEC9] space-y-1.5">
            <div className="flex items-center space-x-2 font-bold text-[#2B231F]">
              <Check className="w-4 h-4 text-[#C97C4C]" />
              <span>4. Complete Export & Deletion</span>
            </div>
            <p className="text-[#665950] font-serif leading-relaxed">
              You can export your complete notebook anytime in standard JSON format or as a formatted text file, or wipe all entries with one click in Settings.
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-[#C97C4C] hover:bg-[#B46A3B] text-[#FFFDF9] font-semibold text-xs transition-colors shadow-xs"
        >
          Understood & Return to Notebook
        </button>
      </div>
    </div>
  );
};

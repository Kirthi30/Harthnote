import React from 'react';
import { Sparkles, Check, ArrowRight, BookOpen, HeartHandshake, EyeOff, Calendar } from 'lucide-react';
import type { JournalEntry } from '../types';
import { MOODS } from '../data/templates';

interface EntrySavedModalProps {
  isOpen: boolean;
  entry: JournalEntry | null;
  reflectionText?: string;
  isLoadingReflection: boolean;
  onDismissReflection: () => void;
  onKeepReflection: () => void;
  onViewHistory: () => void;
  onBackHome: () => void;
}

export const EntrySavedModal: React.FC<EntrySavedModalProps> = ({
  isOpen,
  entry,
  reflectionText,
  isLoadingReflection,
  onDismissReflection,
  onKeepReflection,
  onViewHistory,
  onBackHome,
}) => {
  if (!isOpen || !entry) return null;

  const moodMeta = MOODS[entry.mood];
  const isDistressMessage = reflectionText && reflectionText.includes('988');

  return (
    <div className="fixed inset-0 z-50 bg-[#2B231F]/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#FFFDF9] border border-[#E8DFC8] rounded-3xl max-w-lg w-full p-7 sm:p-8 shadow-2xl text-[#4A3F39] relative overflow-hidden animate-fade-in space-y-6">
        {/* Top Affirmation */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-[#E8F2EB] text-[#4D7C5F] mx-auto flex items-center justify-center shadow-xs">
            <Check className="w-6 h-6 stroke-[2.5]" />
          </div>
          <h3 className="font-display text-2xl font-semibold text-[#2B231F]">
            Your thoughts are safely kept.
          </h3>
          <div className="flex items-center justify-center space-x-2 text-xs text-[#7C7067]">
            <span>{entry.templateTitle}</span>
            <span>·</span>
            <span className="flex items-center space-x-1">
              <span>{moodMeta?.emoji}</span>
              <span>{moodMeta?.label}</span>
            </span>
          </div>
        </div>

        {/* AI Gentle Thought Box (if available) */}
        {isLoadingReflection ? (
          <div className="bg-[#FAF5EC] border border-[#EFE7D8] rounded-2xl p-5 text-center space-y-2">
            <div className="flex items-center justify-center space-x-2 text-xs font-semibold text-[#C97C4C]">
              <Sparkles className="w-4 h-4 animate-spin text-[#C97C4C]" />
              <span>Gathering a gentle thought...</span>
            </div>
            <p className="text-xs text-[#8C8075] font-serif italic">
              Listening softly to what you wrote.
            </p>
          </div>
        ) : reflectionText ? (
          <div className={`p-5 rounded-2xl border transition-all ${
            isDistressMessage
              ? 'bg-[#FEF2F2] border-[#FCA5A5] text-[#991B1B]'
              : 'bg-[#FAF0E8]/70 border-[#EAD7C8] text-[#4A3F39]'
          }`}>
            <div className="flex items-center space-x-2 text-[#C97C4C] mb-2">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                {isDistressMessage ? 'Gentle Support Resource' : 'A Gentle Thought'}
              </span>
            </div>

            <p className="font-serif text-sm sm:text-base text-[#2B231F] leading-relaxed italic">
              "{reflectionText}"
            </p>

            <div className="mt-4 pt-3 border-t border-[#E8DFC8]/60 flex items-center justify-between text-xs">
              <span className="text-[10px] text-[#8C8075]">Non-diagnostic mirror</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={onDismissReflection}
                  className="px-2.5 py-1 rounded-lg hover:bg-[#EFE5D8] text-[#7C7067] flex items-center space-x-1 transition-colors"
                >
                  <EyeOff className="w-3 h-3" />
                  <span>Dismiss</span>
                </button>
                <button
                  onClick={onKeepReflection}
                  className="px-3 py-1 rounded-lg bg-[#C97C4C] hover:bg-[#B46A3B] text-[#FFFDF9] font-medium flex items-center space-x-1 shadow-xs transition-colors"
                >
                  <Check className="w-3 h-3" />
                  <span>Keep in Entry</span>
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {/* Next Actions */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={onBackHome}
            className="w-full py-2.5 px-4 rounded-xl bg-[#EFE8D8] hover:bg-[#E5DAC8] text-[#2B231F] text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Return Home</span>
          </button>

          <button
            onClick={onViewHistory}
            className="w-full py-2.5 px-4 rounded-xl bg-[#C97C4C] hover:bg-[#B46A3B] text-[#FFFDF9] text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors shadow-xs"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>View All Entries</span>
          </button>
        </div>
      </div>
    </div>
  );
};

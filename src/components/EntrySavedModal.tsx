import React, { useState } from 'react';
import { Sparkles, Check, BookOpen, EyeOff, Calendar, Lock } from 'lucide-react';
import type { JournalEntry, AIMemoryLevel } from '../types';
import { MOODS } from '../data/templates';
import { MoodIcon } from './MoodIcon';

interface EntrySavedModalProps {
  isOpen: boolean;
  entry: JournalEntry | null;
  reflectionText?: string;
  isLoadingReflection: boolean;
  aiMemoryLevel?: AIMemoryLevel;
  onDismissReflection: () => void;
  onKeepReflection: (textToKeep?: string) => void;
  onViewHistory: () => void;
  onBackHome: () => void;
}

export const EntrySavedModal: React.FC<EntrySavedModalProps> = ({
  isOpen,
  entry,
  reflectionText,
  isLoadingReflection,
  aiMemoryLevel,
  onDismissReflection,
  onKeepReflection,
  onViewHistory,
  onBackHome,
}) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isKept, setIsKept] = useState(false);

  if (!isOpen || !entry) return null;

  // Defensive check: AI is only enabled if explicitly 'light' or 'deep'
  const isAIPermitted = aiMemoryLevel === 'light' || aiMemoryLevel === 'deep';

  const moodMeta = MOODS[entry.mood];
  const activeReflection = reflectionText || entry.aiReflection;
  const isDistressMessage = activeReflection && activeReflection.includes('988');

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismissReflection();
  };

  const handleKeep = () => {
    setIsKept(true);
    setIsDismissed(false);
    onKeepReflection(activeReflection);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#2B231F]/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#FFFDF9] border border-[#E8DFC8] rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl text-[#4A3F39] relative overflow-hidden animate-fade-in space-y-5 my-8">
        {/* Top Affirmation */}
        <div className="text-center space-y-1.5">
          <div className="w-12 h-12 rounded-full bg-[#E8F2EB] text-[#4D7C5F] mx-auto flex items-center justify-center shadow-xs">
            <Check className="w-6 h-6 stroke-[2.5]" />
          </div>
          <h3 className="font-display text-2xl font-semibold text-[#2B231F]">
            Your thoughts are safely kept.
          </h3>
          <div className="flex items-center justify-center space-x-2 text-xs text-[#7C7067]">
            <span>{entry.templateTitle}</span>
            <span>·</span>
            <span className="flex items-center space-x-1.5">
              <div className="w-4 h-4 flex-shrink-0">
                <MoodIcon mood={entry.mood} className="w-4 h-4" showGlow={false} />
              </div>
              <span>{moodMeta?.label}</span>
            </span>
          </div>
        </div>

        {/* AI Gentle Thought Box (or Private Mode notification) */}
        {!isAIPermitted ? (
          <div className="bg-[#FAF5EC] border border-[#EFE7D8] rounded-2xl p-4 text-center space-y-1">
            <div className="flex items-center justify-center space-x-1.5 text-xs font-semibold text-[#7C7067]">
              <Lock className="w-3.5 h-3.5 text-[#8C8075]" />
              <span>Private Notebook Mode Active</span>
            </div>
            <p className="text-[11px] text-[#8C8075] font-serif">
              Saved strictly to your private journal. AI features and processing are completely disabled per your settings.
            </p>
          </div>
        ) : isLoadingReflection ? (
          <div className="bg-[#FAF5EC] border border-[#EFE7D8] rounded-2xl p-5 text-center space-y-2">
            <div className="flex items-center justify-center space-x-2 text-xs font-semibold text-[#C97C4C]">
              <Sparkles className="w-4 h-4 animate-spin text-[#C97C4C]" />
              <span>
                {aiMemoryLevel === 'deep' 
                  ? 'Gathering a deep continuity reflection...' 
                  : 'Gathering a gentle thought...'}
              </span>
            </div>
            <p className="text-xs text-[#8C8075] font-serif italic">
              Listening softly to what you wrote.
            </p>
          </div>
        ) : activeReflection ? (
          isDismissed ? (
            /* Dismissed state: Suggestion is hidden but NOT deleted; user can still review and keep it */
            <div className="bg-[#FAF5EC] border border-[#EFE7D8] rounded-2xl p-3.5 flex items-center justify-between text-xs text-[#7C7067] animate-fade-in">
              <div className="flex items-center space-x-2">
                <EyeOff className="w-3.5 h-3.5 text-[#8C8075]" />
                <span className="font-serif italic">Gentle thought hidden for this view</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsDismissed(false)}
                  className="text-xs text-[#7C7067] hover:text-[#2B231F] underline cursor-pointer"
                >
                  Review
                </button>
                <button
                  type="button"
                  onClick={handleKeep}
                  className="px-2.5 py-1 rounded-lg bg-[#C97C4C] hover:bg-[#B46A3B] text-[#FFFDF9] font-medium flex items-center space-x-1 shadow-xs transition-colors cursor-pointer"
                >
                  <Check className="w-3 h-3" />
                  <span>Keep in Entry</span>
                </button>
              </div>
            </div>
          ) : (
            <div className={`p-5 rounded-2xl border transition-all ${
              isDistressMessage
                ? 'bg-[#FEF2F2] border-[#FCA5A5] text-[#991B1B]'
                : 'bg-[#FAF0E8]/70 border-[#EAD7C8] text-[#4A3F39]'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2 text-[#C97C4C]">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    {isDistressMessage 
                      ? 'Gentle Support Resource' 
                      : aiMemoryLevel === 'deep' 
                      ? 'A Gentle Thought · Deep Memory' 
                      : 'A Gentle Thought'}
                  </span>
                </div>
                {isKept && (
                  <span className="text-[11px] font-medium text-[#4D7C5F] bg-[#E8F2EB] px-2 py-0.5 rounded-full flex items-center space-x-1">
                    <Check className="w-3 h-3" />
                    <span>Kept in Entry</span>
                  </span>
                )}
              </div>

              <p className="font-serif text-sm sm:text-base text-[#2B231F] leading-relaxed italic">
                "{activeReflection}"
              </p>

              <div className="mt-4 pt-3 border-t border-[#E8DFC8]/60 flex items-center justify-between text-xs">
                <span className="text-[10px] text-[#8C8075]">Non-diagnostic mirror</span>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleDismiss}
                    className="px-2.5 py-1 rounded-lg hover:bg-[#EFE5D8] text-[#7C7067] flex items-center space-x-1 transition-colors cursor-pointer"
                    title="Hide suggestion without deleting it"
                  >
                    <EyeOff className="w-3 h-3" />
                    <span>Dismiss</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleKeep}
                    className={`px-3 py-1 rounded-lg font-medium flex items-center space-x-1 shadow-xs transition-colors cursor-pointer ${
                      isKept
                        ? 'bg-[#4D7C5F] text-[#FFFDF9]'
                        : 'bg-[#C97C4C] hover:bg-[#B46A3B] text-[#FFFDF9]'
                    }`}
                  >
                    <Check className="w-3 h-3" />
                    <span>{isKept ? 'Kept in Entry' : 'Keep in Entry'}</span>
                  </button>
                </div>
              </div>
            </div>
          )
        ) : null}

        {/* Next Actions */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={onBackHome}
            className="w-full py-2.5 px-4 rounded-xl bg-[#EFE8D8] hover:bg-[#E5DAC8] text-[#2B231F] text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Return Home</span>
          </button>

          <button
            onClick={onViewHistory}
            className="w-full py-2.5 px-4 rounded-xl bg-[#C97C4C] hover:bg-[#B46A3B] text-[#FFFDF9] text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>View All Entries</span>
          </button>
        </div>
      </div>
    </div>
  );
};

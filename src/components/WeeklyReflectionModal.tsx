import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  X, 
  BookmarkCheck, 
  MessageSquare, 
  Check, 
  Calendar, 
  BookOpen 
} from 'lucide-react';
import type { WeeklyReflection } from '../types';

interface WeeklyReflectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  reflection: WeeklyReflection | null;
  onSaveAnswers: (updated: WeeklyReflection) => Promise<void>;
  onOpenChatModal?: () => void;
}

export const WeeklyReflectionModal: React.FC<WeeklyReflectionModalProps> = ({
  isOpen,
  onClose,
  reflection,
  onSaveAnswers,
  onOpenChatModal,
}) => {
  const [inquiryAnswers, setInquiryAnswers] = useState<Record<string, string>>({});
  const [userNotes, setUserNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (reflection) {
      setInquiryAnswers(reflection.inquiryAnswers || {});
      setUserNotes(reflection.userNotes || '');
      setSavedSuccess(false);
    }
  }, [reflection?.id, isOpen]);

  if (!isOpen || !reflection) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated: WeeklyReflection = {
        ...reflection,
        inquiryAnswers: { ...inquiryAnswers },
        userNotes: userNotes.trim() || undefined,
        savedAt: Date.now(),
      };
      await onSaveAnswers(updated);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      console.error('Error saving reflection from modal:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#1E1915]/60 backdrop-blur-xs animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="weekly-reflection-modal-title"
    >
      <div 
        className="bg-[#FFFDF9] border border-[#DDD0BC] rounded-3xl w-full max-w-3xl max-h-[88vh] shadow-2xl flex flex-col overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-[#FAF6EE] border-b border-[#E8DFC8] flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FAF0E8] border border-[#EAD6C7] flex items-center justify-center text-[#C97C4C] shadow-2xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 id="weekly-reflection-modal-title" className="font-display text-lg font-semibold text-[#2B231F]">
                  Weekly Reflection Mirror
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#FAF0E8] text-[#8C5230] border border-[#EAD6C7]">
                  Pop-up
                </span>
              </div>
              <p className="text-xs text-[#7C7067] font-serif flex items-center space-x-1.5 mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-[#C97C4C]" />
                <span>{reflection.weekStartDate} — {reflection.weekEndDate}</span>
                <span>·</span>
                <span>{reflection.entriesCount || 0} entries synthesized</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {onOpenChatModal && (
              <button
                onClick={() => {
                  onClose();
                  onOpenChatModal();
                }}
                className="px-3 py-1.5 rounded-xl bg-[#FAF0E8] hover:bg-[#F3E2D3] border border-[#EAD6C7] text-[#8C5230] text-xs font-semibold shadow-2xs transition-all flex items-center space-x-1.5"
                title="Launch AI chat companion on this reflection"
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#C97C4C]" />
                <span className="hidden sm:inline">Chat with Mirror</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl text-[#7C7067] hover:text-[#2B231F] hover:bg-[#EFE8D8] flex items-center justify-center transition-colors"
              aria-label="Close weekly reflection pop-up"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 p-6 sm:p-8 overflow-y-auto space-y-6 bg-[#FFFDF9]">
          {/* Emotional Curve */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C8075]">
              Emotional Curve & Synthesis
            </span>
            <div className="font-serif text-base sm:text-lg text-[#2B231F] leading-relaxed italic bg-[#FAF6EE] p-5 rounded-2xl border border-[#EAE1CF]">
              "{reflection.moodTrendSummary}"
            </div>
          </div>

          {/* Recurring Themes */}
          {reflection.themes && reflection.themes.length > 0 && (
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C8075]">
                Recurring Themes Noticed
              </span>
              <div className="flex flex-wrap gap-2">
                {reflection.themes.map((theme, idx) => (
                  <span
                    key={idx}
                    className="px-3.5 py-1.5 rounded-xl bg-[#FAF0E8] border border-[#EAD6C7] text-xs font-semibold text-[#8C5230] flex items-center space-x-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C97C4C]" />
                    <span>{theme}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Gentle Reflection Inquiries */}
          <div className="space-y-4 pt-2 border-t border-[#EFE7D8]">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C8075] flex items-center space-x-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-[#C97C4C]" />
                  <span>Gentle Inquiries to Ponder</span>
                </span>
                <p className="text-[11px] text-[#7C7067] font-serif mt-0.5">
                  Answer here to keep your personal thoughts preserved with this mirror.
                </p>
              </div>

              {savedSuccess && (
                <span className="text-xs text-green-700 font-semibold bg-green-50 border border-green-200 px-2.5 py-1 rounded-full animate-fade-in flex items-center space-x-1">
                  <Check className="w-3 h-3 text-green-600" />
                  <span>Thoughts Saved!</span>
                </span>
              )}
            </div>

            <div className="space-y-4">
              {reflection.reflectionQuestions.map((q, idx) => {
                const qKey = `q_${idx}`;
                const answer = inquiryAnswers[qKey] || '';
                return (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-[#FAF6EE] border border-[#EAE1CF] space-y-2.5 shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-[#C97C4C] uppercase tracking-wider">
                          Inquiry #{idx + 1}
                        </span>
                        <p className="font-serif text-sm text-[#2B231F] font-medium italic">
                          "{q}"
                        </p>
                      </div>
                      {answer && (
                        <span className="text-[10px] text-[#8C5230] font-semibold flex items-center space-x-1 bg-[#FAF0E8] border border-[#EAD6C7] px-2 py-0.5 rounded-full shrink-0">
                          <Check className="w-3 h-3 text-[#C97C4C]" />
                          <span>Answered</span>
                        </span>
                      )}
                    </div>

                    <textarea
                      rows={2}
                      placeholder="Write your reflections here..."
                      value={answer}
                      onChange={(e) =>
                        setInquiryAnswers((prev) => ({
                          ...prev,
                          [qKey]: e.target.value,
                        }))
                      }
                      className="w-full text-xs font-serif p-2.5 bg-[#FFFDF9] border border-[#DDD0BC] rounded-xl focus:outline-hidden focus:ring-1 focus:ring-[#C97C4C] text-[#2B231F] leading-relaxed resize-y placeholder:text-[#9E9187]"
                    />
                  </div>
                );
              })}
            </div>

            {/* Additional User Notes */}
            <div className="space-y-1.5 pt-2">
              <span className="text-[11px] font-semibold text-[#594C44] uppercase tracking-wider">
                Personal Closing Notes
              </span>
              <textarea
                rows={2}
                placeholder="Any commitments or notes for your week ahead..."
                value={userNotes}
                onChange={(e) => setUserNotes(e.target.value)}
                className="w-full text-xs font-serif p-2.5 bg-[#FAF6EE] border border-[#DDD0BC] rounded-xl focus:outline-hidden focus:ring-1 focus:ring-[#C97C4C] text-[#2B231F] leading-relaxed resize-y placeholder:text-[#9E9187]"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-[#FAF6EE] border-t border-[#E8DFC8] flex items-center justify-between shrink-0">
          {onOpenChatModal ? (
            <button
              onClick={() => {
                onClose();
                onOpenChatModal();
              }}
              className="px-3.5 py-2 rounded-xl bg-[#FAF0E8] hover:bg-[#F0DECE] border border-[#EAD6C7] text-[#8C5230] text-xs font-semibold shadow-2xs transition-all flex items-center space-x-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5 text-[#C97C4C]" />
              <span>Explore Inquiries with AI Chat</span>
            </button>
          ) : <div />}

          <div className="flex items-center space-x-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-[#C97C4C] hover:bg-[#B46A3B] text-[#FFFDF9] font-medium text-xs shadow-xs transition-all flex items-center space-x-1.5 disabled:opacity-50 active:scale-95"
            >
              <BookmarkCheck className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Reflections'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

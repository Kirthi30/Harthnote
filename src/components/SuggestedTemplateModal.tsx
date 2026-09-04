import React, { useState, useEffect } from 'react';
import { X, Sparkles, ArrowRight, ArrowLeft, Check, Compass, Moon, Wind, PenTool, HeartHandshake } from 'lucide-react';
import type { TemplateType } from '../types';
import type { MoodTemplateSuggestion } from '../data/moodTemplateMapping';
import { JOURNAL_TEMPLATES } from '../data/templates';
import { MoodIcon } from './MoodIcon';

interface SuggestedTemplateModalProps {
  suggestion: MoodTemplateSuggestion;
  onUseSuggestedTemplate: (templateId: TemplateType) => void;
  onSelectAnyTemplate: (templateId: TemplateType) => void;
  onClose: () => void;
}

export const SuggestedTemplateModal: React.FC<SuggestedTemplateModalProps> = ({
  suggestion,
  onUseSuggestedTemplate,
  onSelectAnyTemplate,
  onClose,
}) => {
  const [viewingAllTemplates, setViewingAllTemplates] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const getTemplateIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sparkles': return Sparkles;
      case 'Moon': return Moon;
      case 'Compass': return Compass;
      case 'Wind': return Wind;
      case 'HeartHandshake': return HeartHandshake;
      default: return PenTool;
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="suggested-template-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-lg bg-[#FFFDF9] border border-[#E8DFC8] rounded-3xl p-6 sm:p-7 shadow-xl relative overflow-hidden space-y-5 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle decorative top accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#FAF0E8] via-[#C97C4C] to-[#FAF0E8]" />

        {/* Close Button */}
        <button
          id="close-suggested-template-modal-btn"
          type="button"
          onClick={onClose}
          aria-label="Close suggestion popup"
          className="absolute top-4 right-4 text-[#8C8075] hover:text-[#2B231F] p-1.5 rounded-full hover:bg-[#FAF3E6] transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {!viewingAllTemplates ? (
          /* Primary Recommendation View */
          <div className="space-y-4 pt-1">
            {/* You chose: [Mood] */}
            <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#FAF0E8] text-[#C97C4C] border border-[#EAD7C8]">
              <span>You chose:</span>
              <div className="w-4 h-4 flex-shrink-0">
                <MoodIcon mood={suggestion.mood} className="w-4 h-4" showGlow={false} />
              </div>
              <span>{suggestion.moodLabel}</span>
            </div>

            {/* Headline & Context Text */}
            <div className="space-y-1.5">
              <h3
                id="suggested-template-title"
                className="font-display text-xl sm:text-2xl font-bold text-[#2B231F]"
              >
                A gentle place to start
              </h3>
              <p className="text-xs sm:text-sm text-[#594C44] font-serif leading-relaxed">
                We think <strong className="font-semibold text-[#2B231F]">{suggestion.suggestedTemplateTitle}</strong> might help you put what you're feeling into words.
              </p>
            </div>

            {/* Highlighted Recommendation Card */}
            <div className="p-4 rounded-2xl bg-[#FAF6EE] border border-[#E2D6C0] space-y-1.5">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-[#C97C4C] uppercase tracking-wider">
                  Suggested Template:
                </span>
                <span className="text-sm font-bold text-[#2B231F]">
                  {suggestion.suggestedTemplateTitle}
                </span>
              </div>
              <p className="text-xs text-[#6B5C52] font-serif leading-relaxed">
                {suggestion.explanation}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <button
                id="use-suggested-template-btn"
                type="button"
                onClick={() => onUseSuggestedTemplate(suggestion.suggestedTemplateId)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#C97C4C] hover:bg-[#B46A3B] text-[#FFFDF9] font-medium text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-98"
              >
                <span>Use Suggested Template</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                id="choose-another-template-btn"
                type="button"
                onClick={() => setViewingAllTemplates(true)}
                className="px-4 py-2.5 rounded-xl bg-[#FAF3E6] border border-[#E0D4BE] hover:bg-[#EAE0CD] text-[#2B231F] font-medium text-xs sm:text-sm transition-colors text-center cursor-pointer"
              >
                Choose Another Template
              </button>
            </div>
          </div>
        ) : (
          /* All 6 Templates Selection View */
          <div className="space-y-4 pt-1">
            <div className="flex items-center justify-between border-b border-[#EFE7D8] pb-3">
              <button
                type="button"
                onClick={() => setViewingAllTemplates(false)}
                className="inline-flex items-center space-x-1 text-xs font-semibold text-[#8C8075] hover:text-[#2B231F] cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to suggestion</span>
              </button>
              <span className="text-xs font-medium text-[#7C7067]">
                Select any of the 6 templates
              </span>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {JOURNAL_TEMPLATES.map((tmpl) => {
                const Icon = getTemplateIcon(tmpl.iconName);
                const isRecommended = tmpl.id === suggestion.suggestedTemplateId;

                return (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => onSelectAnyTemplate(tmpl.id)}
                    className={`w-full text-left p-3 rounded-2xl border transition-all flex items-start space-x-3 cursor-pointer group ${
                      isRecommended
                        ? 'bg-[#FAF0E8] border-[#C97C4C] ring-1 ring-[#C97C4C]/40'
                        : 'bg-[#FFFDF9] border-[#E8DFC8] hover:bg-[#FAF6EE] hover:border-[#D6C7AE]'
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: tmpl.accentBg, color: tmpl.color }}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs sm:text-sm font-bold text-[#2B231F] group-hover:text-[#C97C4C] transition-colors">
                          {tmpl.title}
                        </span>
                        {isRecommended && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#C97C4C] text-[#FFFDF9]">
                            Recommended
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#7C7067] font-serif line-clamp-1 mt-0.5">
                        {tmpl.subtitle}
                      </p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[#8C8075] group-hover:text-[#C97C4C] group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-2" />
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

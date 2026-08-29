import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Trash2, 
  Edit3, 
  Sparkles, 
  Copy, 
  Check, 
  Share2,
  Calendar,
  Smile,
  X
} from 'lucide-react';
import type { JournalEntry } from '../types';
import { JOURNAL_TEMPLATES, MOODS } from '../data/templates';

interface EntryDetailModalProps {
  entry: JournalEntry | null;
  onClose: () => void;
  onEdit: (entry: JournalEntry) => void;
  onDelete: (entryId: string) => Promise<void>;
  onDismissReflection: (entryId: string) => void;
}

export const EntryDetailModal: React.FC<EntryDetailModalProps> = ({
  entry,
  onClose,
  onEdit,
  onDelete,
  onDismissReflection,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!entry) return null;

  const moodMeta = MOODS[entry.mood];
  const templateMeta = JOURNAL_TEMPLATES.find((t) => t.id === entry.templateType);

  const handleCopy = () => {
    const fullText = `${entry.title || entry.templateTitle}\n${new Date(entry.createdAt).toLocaleDateString()}\nMood: ${moodMeta?.label}\n\n${entry.text}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(entry.id);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#2B231F]/40 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-[#FFFDF9] border border-[#E4DAC3] rounded-3xl max-w-2xl w-full p-6 sm:p-9 shadow-2xl text-[#4A3F39] relative my-auto space-y-6">
        {/* Top Header Actions */}
        <div className="flex items-center justify-between pb-4 border-b border-[#EFE7D8]">
          <button
            onClick={onClose}
            className="inline-flex items-center space-x-1.5 text-xs font-medium text-[#7C7067] hover:text-[#2B231F] px-2.5 py-1.5 rounded-lg hover:bg-[#EAE1CF] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Close</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              title="Copy text"
              className="p-2 rounded-xl text-[#7C7067] hover:text-[#2B231F] hover:bg-[#EAE1CF] transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-[#4D7C5F]" /> : <Copy className="w-4 h-4" />}
            </button>

            <button
              onClick={() => onEdit(entry)}
              title="Edit entry"
              className="p-2 rounded-xl text-[#7C7067] hover:text-[#2B231F] hover:bg-[#EAE1CF] transition-colors"
            >
              <Edit3 className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowDeleteConfirm(true)}
              title="Delete entry"
              className="p-2 rounded-xl text-[#7C7067] hover:text-[#B91C1C] hover:bg-[#FEE2E2] transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Entry Metadata Header */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-lg bg-[#FAF0E8] text-[#C97C4C] font-semibold">
              {entry.templateTitle}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-[#EFE8D8] text-[#5C5149] font-medium flex items-center space-x-1">
              <span>{moodMeta?.emoji}</span>
              <span>{moodMeta?.label}</span>
            </span>
            <span className="text-[#8C8075]">
              {entry.wordCount} words
            </span>
          </div>

          <h3 className="font-display text-2xl sm:text-3xl font-semibold text-[#2B231F] pt-1">
            {entry.title || entry.templateTitle}
          </h3>

          <div className="text-xs text-[#8C8075] font-serif">
            {new Date(entry.createdAt).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} at {new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        {/* Optional Prompt Answers Section */}
        {entry.promptAnswers && Object.keys(entry.promptAnswers).length > 0 && templateMeta && (
          <div className="bg-[#FAF6EE] border border-[#EAE0CD] rounded-2xl p-4 space-y-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#C97C4C]">
              Guiding Reflections
            </span>
            <div className="space-y-2.5">
              {templateMeta.questions.map((q) => {
                const answer = entry.promptAnswers?.[q.id];
                if (!answer) return null;
                return (
                  <div key={q.id} className="text-xs space-y-0.5">
                    <div className="font-medium text-[#7C6E64]">{q.label}</div>
                    <div className="font-serif text-[#2B231F] pl-2 border-l-2 border-[#C97C4C]/40 italic">
                      "{answer}"
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Main Body Text */}
        <div className="font-serif text-base text-[#2B231F] leading-relaxed whitespace-pre-wrap selection:bg-[#C97C4C]/25 py-2">
          {entry.text}
        </div>

        {/* Gentle Thought Box (if present) */}
        {entry.aiReflection && !entry.aiReflectionDismissed && (
          <div className="bg-[#FAF0E8]/70 border border-[#EAD7C8] rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-[#C97C4C]">
              <div className="flex items-center space-x-1.5 font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>A Gentle Thought</span>
              </div>
              <button
                onClick={() => onDismissReflection(entry.id)}
                className="text-[10px] text-[#8C8075] hover:underline"
              >
                Hide
              </button>
            </div>
            <p className="font-serif text-xs sm:text-sm text-[#4A3F39] italic leading-relaxed">
              "{entry.aiReflection}"
            </p>
          </div>
        )}

        {/* Safe Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <div className="p-4 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] space-y-3">
            <p className="text-xs text-[#991B1B] font-medium">
              Are you sure you want to permanently remove this entry from your notebook? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end space-x-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-[#7C7067] hover:bg-[#FEE2E2]"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-3.5 py-1.5 rounded-lg bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-semibold"
              >
                {isDeleting ? 'Removing...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Sparkles, 
  Check, 
  HelpCircle, 
  Flame, 
  Clock, 
  Save, 
  ChevronDown, 
  ChevronUp,
  Smile,
  Quote,
  Plus,
  RefreshCw,
  Lightbulb,
  X
} from 'lucide-react';
import type { JournalEntry, MoodType, TemplateType, UserProfile } from '../types';
import { JOURNAL_TEMPLATES, MOODS } from '../data/templates';

const INSPIRED_PROMPTS = [
  "What is one small, quiet moment from today that brought you a sense of ease?",
  "If your mind were a room right now, what does it look like and what would make it feel cozier?",
  "What is a thought or feeling you've been carrying quietly that needs room to breathe?",
  "What is one unexpected kindness—given, received, or witnessed—that touched you recently?",
  "What is a gentle truth or lesson this week has been nudging you to notice?",
  "What can you give yourself full, compassionate permission to let go of today?",
  "Where in your body or in your day did you feel most grounded and at home with yourself?",
  "What is something simple you are genuinely looking forward to, no matter how small?",
];

interface JournalEditorProps {
  initialTemplate?: TemplateType;
  initialEntry?: JournalEntry | null;
  initialMood?: MoodType | null;
  onMoodChange?: (mood: MoodType) => void;
  onSave: (entryData: {
    templateType: TemplateType;
    templateTitle: string;
    title: string;
    text: string;
    promptAnswers: Record<string, string>;
    mood: MoodType;
    moodLabel: string;
    wordCount: number;
  }) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
  userProfile: UserProfile | null;
}

export const JournalEditor: React.FC<JournalEditorProps> = ({
  initialTemplate = 'freewrite',
  initialEntry,
  initialMood,
  onMoodChange,
  onSave,
  onCancel,
  isSaving,
}) => {
  const [templateId, setTemplateId] = useState<TemplateType>(initialEntry?.templateType || initialTemplate);
  const [title, setTitle] = useState(initialEntry?.title || '');
  const [text, setText] = useState(initialEntry?.text || '');
  const [promptAnswers, setPromptAnswers] = useState<Record<string, string>>(initialEntry?.promptAnswers || {});
  const [selectedMood, setSelectedMood] = useState<MoodType>(initialEntry?.mood || initialMood || 'calm');
  const [showPromptsHelper, setShowPromptsHelper] = useState(true);
  const [draftSavedTime, setDraftSavedTime] = useState<string | null>(null);

  // Quote Generator State
  const [generatedQuote, setGeneratedQuote] = useState<{ quote: string; author: string } | null>(null);
  const [isGeneratingQuote, setIsGeneratingQuote] = useState(false);
  const [quoteAdded, setQuoteAdded] = useState(false);

  // Inspired Reflection Prompt State
  const [currentInspiredPrompt, setCurrentInspiredPrompt] = useState<string | null>(null);

  // Sync mood if initialEntry or initialMood updates
  useEffect(() => {
    if (initialEntry?.mood) {
      setSelectedMood(initialEntry.mood);
    } else if (initialMood) {
      setSelectedMood(initialMood);
    }
  }, [initialEntry?.mood, initialMood]);

  const currentTemplate = JOURNAL_TEMPLATES.find((t) => t.id === templateId) || JOURNAL_TEMPLATES[4];

  // Calculate word count
  const countWords = (str: string) => {
    const trimmed = str.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).length;
  };

  const totalWords = countWords(text) + Object.values(promptAnswers).reduce((acc, v) => acc + countWords(v), 0);

  // Local draft autosave simulation
  useEffect(() => {
    const timer = setTimeout(() => {
      if (text || Object.keys(promptAnswers).length > 0) {
        setDraftSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [text, promptAnswers, title, selectedMood]);

  const handlePromptAnswerChange = (qId: string, val: string) => {
    setPromptAnswers((prev) => ({
      ...prev,
      [qId]: val,
    }));
  };

  const handleGenerateQuote = async () => {
    setIsGeneratingQuote(true);
    setQuoteAdded(false);
    try {
      const res = await fetch('/api/gemini/generate-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entryText: text,
          mood: selectedMood,
          promptAnswers,
        }),
      });
      const data = await res.json();
      if (data.quote) {
        setGeneratedQuote({ quote: data.quote, author: data.author || 'Journal Companion' });
      }
    } catch (err) {
      console.error('Quote generation error:', err);
      setGeneratedQuote({
        quote: 'In the quiet stream of your own thoughts, truth finds its natural voice.',
        author: 'Hearthnote Reflection',
      });
    } finally {
      setIsGeneratingQuote(false);
    }
  };

  const handleAddQuoteToJournal = () => {
    if (!generatedQuote) return;
    const quoteBlock = `\n\n> "${generatedQuote.quote}"\n— ${generatedQuote.author}`;
    setText((prev) => (prev ? prev + quoteBlock : quoteBlock.trim()));
    setQuoteAdded(true);
  };

  const handleGetInspired = () => {
    let pool = INSPIRED_PROMPTS;
    if (currentInspiredPrompt) {
      pool = INSPIRED_PROMPTS.filter((p) => p !== currentInspiredPrompt);
    }
    const randomPrompt = pool[Math.floor(Math.random() * pool.length)];
    setCurrentInspiredPrompt(randomPrompt);
  };

  const handleInsertInspiredPrompt = () => {
    if (!currentInspiredPrompt) return;
    const promptFormatted = `\n\n> *Prompt: ${currentInspiredPrompt}*\n\n`;
    if (!text.trim()) {
      setText(`> *Prompt: ${currentInspiredPrompt}*\n\n`);
    } else {
      setText((prev) => `${prev.trim()}${promptFormatted}`);
    }
  };

  const handleSave = async () => {
    let combinedText = text.trim();
    
    // If user answered questions, append or combine if main text is empty
    if (!combinedText && Object.keys(promptAnswers).length > 0) {
      combinedText = Object.entries(promptAnswers)
        .map(([qId, ans]) => {
          const q = currentTemplate.questions.find((item) => item.id === qId);
          return `${q?.label || 'Prompt'}:\n${ans}`;
        })
        .join('\n\n');
    }

    await onSave({
      templateType: templateId,
      templateTitle: currentTemplate.title,
      title: title.trim() || `${currentTemplate.title} — ${new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`,
      text: combinedText || 'A quiet moment of reflection.',
      promptAnswers,
      mood: selectedMood,
      moodLabel: MOODS[selectedMood]?.label || 'Calm',
      wordCount: totalWords,
    });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Bar Navigation & Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={onCancel}
          className="inline-flex items-center space-x-1.5 text-xs font-medium text-[#7C7067] hover:text-[#2B231F] px-2.5 py-1.5 rounded-lg hover:bg-[#EAE1CF] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Notebook</span>
        </button>

        <div className="flex items-center space-x-3">
          {draftSavedTime && (
            <span className="text-[11px] text-[#8C8075] flex items-center space-x-1">
              <Clock className="w-3 h-3 text-[#4D7C5F]" />
              <span>Draft kept {draftSavedTime}</span>
            </span>
          )}

          <button
            id="close-save-entry-btn"
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2 rounded-xl bg-[#C97C4C] hover:bg-[#B46A3B] text-[#FFFDF9] font-medium text-xs shadow-xs transition-all flex items-center space-x-2 disabled:opacity-60"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Preserving...' : 'Close & Save Entry'}</span>
          </button>
        </div>
      </div>

      {/* Main Notebook Surface Card */}
      <div className="bg-[#FFFDF9] border border-[#E4DAC3] rounded-3xl p-6 sm:p-9 shadow-sm space-y-6 relative overflow-hidden">
        {/* Subtle decorative left margin rule */}
        <div className="absolute top-0 bottom-0 left-6 sm:left-10 w-[1px] bg-[#F1E5D3] pointer-events-none" />

        {/* Template Selector Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#EFE7D8]">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-[#8C8075]">Template:</span>
            <select
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value as TemplateType)}
              className="text-xs font-semibold text-[#2B231F] bg-[#FAF3E6] border border-[#E0D4BE] rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-[#C97C4C] cursor-pointer"
            >
              {JOURNAL_TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>

          {/* In-Editor Mood Selector */}
          <div className="flex flex-wrap items-center gap-1.5 bg-[#FAF6EE] p-1.5 rounded-xl border border-[#EAE1CF]">
            <span className="text-[11px] font-medium text-[#7C7067] px-2 flex items-center space-x-1">
              <Smile className="w-3 h-3" />
              <span>Mood:</span>
            </span>
            {(Object.keys(MOODS) as MoodType[]).map((mKey) => {
              const m = MOODS[mKey];
              const isSelected = selectedMood === mKey;
              return (
                <button
                  key={mKey}
                  type="button"
                  onClick={() => {
                    setSelectedMood(mKey);
                    if (onMoodChange) onMoodChange(mKey);
                  }}
                  title={`${m.label}: ${m.description}`}
                  className={`px-2 py-1 rounded-lg text-xs transition-all ${
                    isSelected
                      ? 'bg-[#C97C4C] text-[#FFFDF9] font-bold shadow-xs'
                      : 'hover:bg-[#EFE8D8] text-[#594C44]'
                  }`}
                >
                  <span className="mr-0.5">{m.emoji}</span>
                  <span className="hidden sm:inline text-[11px]">{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Template Questions Accordion / Helper */}
        {currentTemplate.questions.length > 0 && (
          <div className="bg-[#FAF6EE] border border-[#EAE0CD] rounded-2xl p-4 space-y-3">
            <div
              onClick={() => setShowPromptsHelper(!showPromptsHelper)}
              className="flex items-center justify-between cursor-pointer text-[#6B5A4E] select-none"
            >
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-[#C97C4C]" />
                <span className="text-xs font-semibold uppercase tracking-wider text-[#C97C4C]">
                  Guiding Questions for {currentTemplate.title}
                </span>
              </div>
              <button className="text-xs text-[#8C8075]">
                {showPromptsHelper ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {showPromptsHelper && (
              <div className="space-y-3 pt-2">
                {currentTemplate.questions.map((q, idx) => (
                  <div key={q.id} className="space-y-1">
                    <label className="block text-xs font-medium text-[#2B231F]">
                      {idx + 1}. {q.label}
                    </label>
                    <input
                      type="text"
                      placeholder={q.placeholder}
                      value={promptAnswers[q.id] || ''}
                      onChange={(e) => handlePromptAnswerChange(q.id, e.target.value)}
                      className="w-full text-xs font-serif p-2.5 bg-[#FFFDF9] border border-[#E5DAC4] rounded-xl focus:outline-hidden focus:ring-1 focus:ring-[#C97C4C] text-[#2B231F] placeholder:text-[#9E9388]"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Entry Title */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2.5">
          <div className="space-y-1 flex-1">
            <input
              type="text"
              placeholder={currentTemplate.starterPrompt}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full font-display text-xl sm:text-2xl font-semibold text-[#2B231F] placeholder:text-[#B4A79A] border-none bg-transparent focus:outline-hidden px-0"
            />
            <div className="text-[11px] text-[#8C8075] font-serif">
              {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
          </div>

          <button
            type="button"
            onClick={handleGetInspired}
            className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-[#FAF0E8] hover:bg-[#F2E5D8] text-[#C97C4C] border border-[#F0D5BE] text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-2xs flex-shrink-0"
            title="Generate a gentle writing prompt to overcome writer's block"
          >
            <Lightbulb className="w-3.5 h-3.5 text-[#C97C4C]" />
            <span>Get Inspired</span>
          </button>
        </div>

        {/* Inspired Prompt Card when active */}
        {currentInspiredPrompt && (
          <div className="p-4 rounded-2xl bg-[#FAF0E8] border border-[#F0D5BE] space-y-2.5 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-[#8C522A] flex items-center space-x-1.5 uppercase tracking-wider">
                <Lightbulb className="w-4 h-4 text-[#C97C4C]" />
                <span>Gentle Reflection Prompt</span>
              </div>
              <button
                type="button"
                onClick={() => setCurrentInspiredPrompt(null)}
                className="text-[#A3978C] hover:text-[#2B231F] text-xs cursor-pointer p-1"
                aria-label="Close prompt"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs sm:text-sm font-serif font-medium text-[#2B231F] leading-relaxed italic">
              "{currentInspiredPrompt}"
            </p>
            <div className="flex items-center space-x-2 pt-1">
              <button
                type="button"
                onClick={handleInsertInspiredPrompt}
                className="px-3 py-1.5 rounded-xl bg-[#C97C4C] hover:bg-[#B46A3B] text-white text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Insert Prompt into Page</span>
              </button>
              <button
                type="button"
                onClick={handleGetInspired}
                className="px-3 py-1.5 rounded-xl bg-[#FFFDF9] hover:bg-[#F4ECE1] text-[#7C7067] hover:text-[#2B231F] border border-[#E8DFC8] text-xs font-semibold transition-colors cursor-pointer"
              >
                <span>Another Prompt</span>
              </button>
            </div>
          </div>
        )}

        {/* Writing Surface / Freeform Text Area */}
        <div className="relative">
          <textarea
            rows={12}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write your thoughts freely here. No rushing, no rules..."
            className="w-full notebook-lines font-serif text-base text-[#2B231F] placeholder:text-[#A89C8F] border-none bg-transparent focus:outline-hidden resize-y leading-7 selection:bg-[#C97C4C]/25"
          />
        </div>

        {/* AI Inspired Quote Generator Section */}
        <div className="bg-[#FAF4E8] border border-[#E8DFC8] rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-[#C97C4C]">
              <Quote className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Content-Inspired Quote
              </span>
            </div>

            <button
              type="button"
              onClick={handleGenerateQuote}
              disabled={isGeneratingQuote}
              className="px-3 py-1.5 rounded-xl bg-[#FAF0E8] hover:bg-[#F4E3D5] text-[#C97C4C] text-xs font-semibold transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isGeneratingQuote ? 'Generating...' : generatedQuote ? 'Refresh Quote' : 'Generate Quote from Writing'}</span>
            </button>
          </div>

          {generatedQuote && (
            <div className="p-3.5 rounded-xl bg-[#FFFDF9] border border-[#EAE1CF] space-y-2.5 animate-fade-in">
              <p className="text-xs font-serif italic text-[#2B231F] leading-relaxed">
                "{generatedQuote.quote}"
              </p>
              <div className="flex items-center justify-between text-[11px] pt-1">
                <span className="text-[#8C8075] font-serif">— {generatedQuote.author}</span>
                <button
                  type="button"
                  onClick={handleAddQuoteToJournal}
                  disabled={quoteAdded}
                  className="px-3 py-1 rounded-lg bg-[#C97C4C] hover:bg-[#B46A3B] text-[#FFFDF9] font-medium text-xs transition-colors flex items-center space-x-1 disabled:bg-[#4D7C5F] disabled:cursor-default"
                >
                  {quoteAdded ? (
                    <>
                      <Check className="w-3 h-3" />
                      <span>Added into Journal</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3 h-3" />
                      <span>Add Quote into Journal</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Info Bar */}
        <div className="flex items-center justify-between pt-4 border-t border-[#F0E7D6] text-[11px] text-[#8C8075]">
          <span>
            {totalWords} {totalWords === 1 ? 'word' : 'words'}
          </span>
          <span className="font-serif italic text-[#9C8F83]">
            "Writing is thinking on paper."
          </span>
        </div>
      </div>
    </div>
  );
};

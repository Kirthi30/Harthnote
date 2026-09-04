import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Sparkles, 
  Check, 
  HelpCircle, 
  Clock, 
  Save, 
  ChevronDown, 
  ChevronUp,
  Plus,
  RefreshCw,
  Mic,
  MicOff,
  Globe,
  AlertCircle,
  X,
  EyeOff,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Quote,
  Minus,
  BookOpen
} from 'lucide-react';
import type { JournalEntry, MoodType, TemplateType, UserProfile, WriteEntrySource } from '../types';
import { JOURNAL_TEMPLATES, MOODS, getTemplateById } from '../data/templates';
import { polishSpeechLocally } from '../utils/speechPolishEngine';
import { SuggestedTemplateModal } from './SuggestedTemplateModal';
import { getSuggestedTemplateForMood, MoodTemplateSuggestion } from '../data/moodTemplateMapping';

export const VOICE_LANGUAGES = [
  { code: 'en-US', label: 'English (US)', flag: '🇺🇸' },
  { code: 'en-GB', label: 'English (UK)', flag: '🇬🇧' },
  { code: 'en-IN', label: 'English (India)', flag: '🇮🇳' },
  { code: 'es-ES', label: 'Español (España)', flag: '🇪🇸' },
  { code: 'es-MX', label: 'Español (México)', flag: '🇲🇽' },
  { code: 'fr-FR', label: 'Français (France)', flag: '🇫🇷' },
  { code: 'de-DE', label: 'Deutsch (Germany)', flag: '🇩🇪' },
  { code: 'it-IT', label: 'Italiano (Italy)', flag: '🇮🇹' },
  { code: 'pt-BR', label: 'Português (Brasil)', flag: '🇧🇷' },
  { code: 'hi-IN', label: 'हिन्दी (Hindi)', flag: '🇮🇳' },
  { code: 'ta-IN', label: 'தமிழ் (Tamil)', flag: '🇮🇳' },
  { code: 'te-IN', label: 'తెలుగు (Telugu)', flag: '🇮🇳' },
  { code: 'bn-IN', label: 'বাংলা (Bengali)', flag: '🇮🇳' },
  { code: 'zh-CN', label: '中文 (Mandarin)', flag: '🇨🇳' },
  { code: 'ja-JP', label: '日本語 (Japanese)', flag: '🇯🇵' },
  { code: 'ko-KR', label: '한국어 (Korean)', flag: '🇰🇷' },
  { code: 'ar-SA', label: 'العربية (Arabic)', flag: '🇸🇦' },
  { code: 'ru-RU', label: 'Русский (Russian)', flag: '🇷🇺' },
];

interface JournalEditorProps {
  initialTemplate?: TemplateType;
  initialEntry?: JournalEntry | null;
  initialMood?: MoodType | null;
  entrySource?: WriteEntrySource;
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
  entrySource = 'direct',
  onMoodChange,
  onSave,
  onCancel,
  isSaving,
  userProfile,
}) => {
  // Defensive privacy-safe default: AI features in the Write section are disabled unless explicitly allowed ('light' or 'deep')
  const isAIPermitted = Boolean(
    userProfile?.aiMemoryLevel && (userProfile.aiMemoryLevel === 'light' || userProfile.aiMemoryLevel === 'deep')
  );

  const [templateId, setTemplateId] = useState<TemplateType>(
    initialEntry?.templateType || (entrySource === 'blank_page' ? 'blank' : initialTemplate)
  );
  const [title, setTitle] = useState(initialEntry?.title || '');
  const [text, setText] = useState(initialEntry?.text || '');
  const [promptAnswers, setPromptAnswers] = useState<Record<string, string>>(initialEntry?.promptAnswers || {});
  const [selectedMood, setSelectedMood] = useState<MoodType>(initialEntry?.mood || initialMood || 'calm');
  const [showPromptsHelper, setShowPromptsHelper] = useState(true);
  const [draftSavedTime, setDraftSavedTime] = useState<string | null>(null);

  // Suggested-Template Popup State: ONLY triggered when user entered via General Write with a Home mood selected
  const [suggestedModalData, setSuggestedModalData] = useState<MoodTemplateSuggestion | null>(() => {
    if (entrySource === 'general_write' && initialMood && !initialEntry) {
      return getSuggestedTemplateForMood(initialMood);
    }
    return null;
  });

  // Template Switching Confirmation State (protects entered prompt answers)
  const [pendingTemplateId, setPendingTemplateId] = useState<TemplateType | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleUseSuggestedTemplate = (targetTemplateId: TemplateType) => {
    setSuggestedModalData(null);
    handleAttemptTemplateChange(targetTemplateId);
  };

  const handleSelectAnyTemplate = (targetTemplateId: TemplateType) => {
    setSuggestedModalData(null);
    handleAttemptTemplateChange(targetTemplateId);
  };

  const handleCloseSuggestionModal = () => {
    setSuggestedModalData(null);
  };

  const handleAttemptTemplateChange = (newTemplateId: TemplateType) => {
    if (newTemplateId === templateId) return;
    const hasAnswers = Object.values(promptAnswers).some((ans) => ans && ans.trim().length > 0);
    if (hasAnswers) {
      setPendingTemplateId(newTemplateId);
    } else {
      setTemplateId(newTemplateId);
    }
  };

  const handleConfirmTemplateSwitch = () => {
    if (pendingTemplateId) {
      setPromptAnswers({});
      setTemplateId(pendingTemplateId);
      setPendingTemplateId(null);
    }
  };

  const handleCancelTemplateSwitch = () => {
    setPendingTemplateId(null);
  };

  const insertFormatting = (prefix: string, suffix: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const prevText = text;
    const selectedText = prevText.substring(start, end);
    const replacement = selectedText ? `${prefix}${selectedText}${suffix}` : `${prefix}${suffix}`;
    const updatedText = prevText.substring(0, start) + replacement + prevText.substring(end);
    setText(updatedText);
    setTimeout(() => {
      textarea.focus();
      const newCursor = selectedText ? start + replacement.length : start + prefix.length;
      textarea.setSelectionRange(newCursor, newCursor);
    }, 0);
  };

  // In-Editor Suggested Reflection State (with Keep in Entry & Dismiss)
  const [suggestedThought, setSuggestedThought] = useState<string>(
    isAIPermitted && initialEntry?.aiReflection && !initialEntry.aiReflectionDismissed
      ? initialEntry.aiReflection
      : ''
  );
  const [isSuggestionDismissed, setIsSuggestionDismissed] = useState(false);
  const [isThoughtKept, setIsThoughtKept] = useState(
    Boolean(isAIPermitted && initialEntry?.aiReflection && initialEntry?.text.includes(initialEntry.aiReflection))
  );
  const [isLoadingThought, setIsLoadingThought] = useState(false);

  // Dynamic reaction when privacy settings change
  useEffect(() => {
    if (!isAIPermitted) {
      setSuggestedThought('');
      setIsSuggestionDismissed(false);
      setIsThoughtKept(false);
    } else if (initialEntry?.aiReflection && !initialEntry.aiReflectionDismissed) {
      setSuggestedThought(initialEntry.aiReflection);
      setIsThoughtKept(Boolean(initialEntry?.text.includes(initialEntry.aiReflection)));
    }
  }, [isAIPermitted, initialEntry?.aiReflection, initialEntry?.aiReflectionDismissed, initialEntry?.text]);

  // Multi-Language Voice Dictation State
  const recognitionRef = useRef<any>(null);
  const [isListening, setIsListening] = useState(false);
  const [selectedVoiceLang, setSelectedVoiceLang] = useState('en-US');
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [micError, setMicError] = useState<string | null>(null);

  // Clean up speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore cleanup abort errors
        }
      }
    };
  }, []);

  // Sync state if initialEntry, initialTemplate, entrySource, or initialMood updates
  useEffect(() => {
    if (initialEntry) {
      setTemplateId(initialEntry.templateType || 'freewrite');
      setTitle(initialEntry.title || '');
      setText(initialEntry.text || '');
      setPromptAnswers(initialEntry.promptAnswers || {});
      setSelectedMood(initialEntry.mood || initialMood || 'calm');
      setSuggestedModalData(null);
    } else {
      const targetTmpl = entrySource === 'blank_page' ? 'blank' : (initialTemplate || 'freewrite');
      setTemplateId(targetTmpl);
      setTitle('');
      setText('');
      setPromptAnswers({});
      setSelectedMood(initialMood || 'calm');
      if (entrySource === 'general_write' && initialMood) {
        setSuggestedModalData(getSuggestedTemplateForMood(initialMood));
      } else {
        setSuggestedModalData(null);
      }
    }
  }, [initialEntry, initialTemplate, entrySource, initialMood]);

  const currentTemplate = getTemplateById(templateId);
  const currentLang = VOICE_LANGUAGES.find((l) => l.code === selectedVoiceLang) || VOICE_LANGUAGES[0];

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

  // Voice Dictation Controller
  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore stop error
        }
      }
      setIsListening(false);
      setInterimTranscript('');
      return;
    }

    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      setMicError("Voice dictation isn't supported in this browser. Please try Chrome, Edge, or Safari.");
      return;
    }

    setMicError(null);
    try {
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = selectedVoiceLang;

      recognition.onstart = () => {
        setIsListening(true);
        setMicError(null);
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcriptPiece = event.results[i][0]?.transcript || '';
          if (event.results[i].isFinal) {
            const cleanFinal = transcriptPiece.trim();
            if (cleanFinal) {
              // In Pure Private Notebook mode (isAIPermitted === false), insert raw speech recognition directly without any AI speech polishing or rewriting
              const textToAdd = isAIPermitted
                ? (polishSpeechLocally(cleanFinal, selectedVoiceLang) || cleanFinal)
                : cleanFinal;

              // Convert detected voice and write the content directly into the notebook page
              setText((prev) => {
                if (!prev.trim()) return textToAdd;
                const separator = prev.endsWith(' ') || prev.endsWith('\n') ? '' : ' ';
                return prev + separator + textToAdd;
              });
            }
          } else {
            interim += transcriptPiece;
          }
        }
        setInterimTranscript(interim);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setMicError('Microphone access blocked. Please enable microphone permissions in your browser.');
        } else if (event.error === 'network') {
          setMicError('Speech recognition connection error. Please verify network connectivity.');
        } else if (event.error !== 'no-speech') {
          setMicError(`Voice error: ${event.error}`);
        }
        setIsListening(false);
        setInterimTranscript('');
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimTranscript('');
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Failed to start speech recognition:', err);
      setMicError('Microphone error: ' + (err?.message || 'Unable to access audio device.'));
      setIsListening(false);
    }
  };

  const handleSelectLanguage = (code: string) => {
    setSelectedVoiceLang(code);
    setShowLangMenu(false);
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setTimeout(() => {
        toggleListening();
      }, 250);
    }
  };

  const handleKeepThoughtInEntry = () => {
    if (!suggestedThought.trim()) return;
    const thoughtText = suggestedThought.trim();

    setText((prev) => {
      // Prevent duplication if clicked multiple times
      if (prev.includes(thoughtText)) {
        return prev;
      }
      const formatted = `\n\nGentle Reflection:\n"${thoughtText}"`;
      if (!prev.trim()) {
        return `Gentle Reflection:\n"${thoughtText}"`;
      }
      return prev.trimEnd() + formatted;
    });
    setIsThoughtKept(true);
    setIsSuggestionDismissed(false);
  };

  const handleDismissThought = () => {
    setIsSuggestionDismissed(true);
  };

  const handleRequestReflection = async () => {
    // Guard against unauthorized AI processing in Pure Private Notebook mode
    if (!isAIPermitted) return;
    if (!text.trim() && Object.keys(promptAnswers).length === 0) return;
    setIsLoadingThought(true);
    try {
      const resp = await fetch('/api/gemini/reflect-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entryText: text,
          templateTitle: currentTemplate.title,
          mood: selectedMood,
          promptAnswers,
          aiMemoryLevel: userProfile?.aiMemoryLevel || 'light',
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.reflection) {
          setSuggestedThought(data.reflection);
          setIsSuggestionDismissed(false);
          setIsThoughtKept(text.includes(data.reflection));
        }
      }
    } catch (err) {
      console.warn('In-editor reflection fetch error:', err);
    } finally {
      setIsLoadingThought(false);
    }
  };

  const handleSave = async () => {
    // If voice recording is still active, stop it before preserving
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      setIsListening(false);
    }

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

    const isBlank = templateId === 'blank';
    const fallbackTitle = isBlank
      ? `Journal Entry — ${new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
      : `${currentTemplate.title} — ${new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;

    await onSave({
      templateType: templateId,
      templateTitle: isBlank ? 'Blank Page' : currentTemplate.title,
      title: title.trim() || fallbackTitle,
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
          <span>Back to History</span>
        </button>

        {/* Top Right Corner Controls: Draft status, Voice Dictation Mic, and Save Button */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {draftSavedTime && (
            <span className="text-[11px] text-[#8C8075] hidden md:flex items-center space-x-1">
              <Clock className="w-3 h-3 text-[#4D7C5F]" />
              <span>Draft kept {draftSavedTime}</span>
            </span>
          )}

          {/* In-Editor Gentle Reflection Trigger - Only visible when AI is explicitly permitted */}
          {isAIPermitted && (
            <button
              type="button"
              onClick={handleRequestReflection}
              disabled={isLoadingThought || (!text.trim() && Object.keys(promptAnswers).length === 0)}
              className="px-3 py-2 rounded-xl bg-[#FAF3E6] border border-[#E0D4BE] hover:bg-[#EAE0CD] text-[#C97C4C] text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-50"
              title="Receive a gentle reflection or guiding thought based on your current writing"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isLoadingThought ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isLoadingThought ? 'Reflecting...' : 'Reflect'}</span>
            </button>
          )}

          {/* Voice Mic Button with Multi-Language Support at Top Right Corner */}
          <div className="flex items-center relative">
            <button
              id="voice-dictation-mic-btn"
              type="button"
              onClick={toggleListening}
              title={isListening ? 'Click to stop voice recording' : `Click to dictate into notebook page in ${currentLang.label}`}
              className={`px-3 py-2 rounded-l-xl text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-xs cursor-pointer ${
                isListening
                  ? 'bg-[#DC2626] text-[#FFFDF9] ring-2 ring-[#DC2626]/40 animate-pulse'
                  : 'bg-[#FAF3E6] border border-r-0 border-[#E0D4BE] text-[#2B231F] hover:bg-[#EAE0CD]'
              }`}
            >
              {isListening ? (
                <>
                  <MicOff className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Listening...</span>
                </>
              ) : (
                <>
                  <Mic className="w-3.5 h-3.5 text-[#C97C4C]" />
                  <span className="hidden sm:inline">Mic</span>
                </>
              )}
            </button>

            {/* Language Selector Dropdown Toggle */}
            <button
              id="voice-language-selector-btn"
              type="button"
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="px-2 py-2 rounded-r-xl bg-[#FAF3E6] border border-[#E0D4BE] text-[#2B231F] text-xs hover:bg-[#EAE0CD] flex items-center space-x-1 transition-colors cursor-pointer"
              title={`Voice Language: ${currentLang.label}. Click to switch language.`}
            >
              <span className="text-xs">{currentLang.flag}</span>
              <ChevronDown className="w-3 h-3 text-[#7C7067]" />
            </button>

            {/* Multi-Language Dropdown Menu */}
            {showLangMenu && (
              <div className="absolute top-full right-0 mt-2 w-60 bg-[#FFFDF9] border border-[#E4DAC3] rounded-2xl shadow-xl z-50 p-2 space-y-1 max-h-72 overflow-y-auto">
                <div className="text-[10px] font-bold text-[#8C8075] uppercase tracking-wider px-2.5 py-1 flex items-center justify-between">
                  <span>Dictation Language</span>
                  <Globe className="w-3 h-3 text-[#C97C4C]" />
                </div>
                {VOICE_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => handleSelectLanguage(lang.code)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      selectedVoiceLang === lang.code
                        ? 'bg-[#FAF0E8] text-[#C97C4C] font-bold'
                        : 'text-[#2B231F] hover:bg-[#FAF6EE]'
                    }`}
                  >
                    <span className="flex items-center space-x-2">
                      <span>{lang.flag}</span>
                      <span>{lang.label}</span>
                    </span>
                    {selectedVoiceLang === lang.code && (
                      <Check className="w-3.5 h-3.5 text-[#C97C4C]" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            id="close-save-entry-btn"
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 sm:px-5 py-2 rounded-xl bg-[#C97C4C] hover:bg-[#B46A3B] text-[#FFFDF9] font-medium text-xs shadow-xs transition-all flex items-center space-x-2 disabled:opacity-60 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Preserving...' : 'Close & Save Entry'}</span>
          </button>
        </div>
      </div>

      {/* Mic Error Notice if any */}
      {micError && (
        <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-2xl p-3 px-4 text-xs text-[#991B1B] flex items-center justify-between animate-fade-in">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-[#DC2626] flex-shrink-0" />
            <span>{micError}</span>
          </div>
          <button
            type="button"
            onClick={() => setMicError(null)}
            className="text-[#991B1B] hover:text-[#DC2626] p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Notebook Surface Card */}
      <div className="bg-[#FFFDF9] border border-[#E4DAC3] rounded-3xl p-6 sm:p-9 shadow-sm space-y-6 relative overflow-hidden">
        {/* Subtle decorative left margin rule */}
        <div className="absolute top-0 bottom-0 left-6 sm:left-10 w-[1px] bg-[#F1E5D3] pointer-events-none" />

        {/* Template Selector Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#EFE7D8]">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-[#8C8075]">Template:</span>
            <select
              id="write-template-selector"
              value={templateId}
              onChange={(e) => handleAttemptTemplateChange(e.target.value as TemplateType)}
              className="text-xs font-semibold text-[#2B231F] bg-[#FAF3E6] border border-[#E0D4BE] rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-[#C97C4C] cursor-pointer"
            >
              <option value="blank">Blank Page (No Template)</option>
              {JOURNAL_TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-3 text-xs text-[#8C8075]">
            <span className="font-serif">
              {totalWords} {totalWords === 1 ? 'word' : 'words'}
            </span>
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
                <HelpCircle className="w-4 h-4 text-[#C97C4C]" />
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
        <div className="space-y-1">
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

        {/* Live Voice Dictation Active Banner & Transcription Status */}
        {isListening && (
          <div className="bg-[#FAF0E8] border border-[#EAD7C8] rounded-2xl p-3 sm:p-4 space-y-2 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626] animate-ping" />
                <span className="text-xs font-bold text-[#C97C4C]">
                  Voice Dictation Active ({currentLang.flag} {currentLang.label})
                </span>
              </div>
              <button
                type="button"
                onClick={toggleListening}
                className="text-xs font-semibold text-[#DC2626] hover:underline cursor-pointer"
              >
                Stop Listening
              </button>
            </div>
            <p className="text-xs font-serif italic text-[#4A3F39]">
              {interimTranscript ? (
                <span>Hearing: "{interimTranscript}"</span>
              ) : (
                <span className="text-[#8C8075]">Speak in {currentLang.label}. Your spoken words are converted to text directly on the page...</span>
              )}
            </p>
          </div>
        )}

        {/* Suggested Thought & Reflection Flow in Write Section - Only rendered when AI is explicitly permitted */}
        {isAIPermitted && suggestedThought && !isSuggestionDismissed && (
          <div className="bg-[#FAF0E8]/75 border border-[#EAD7C8] rounded-2xl p-4 sm:p-5 space-y-2.5 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-[#C97C4C]">
                <Sparkles className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">
                  Gentle Thought & Reflection
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleDismissThought}
                  className="px-2.5 py-1 rounded-lg hover:bg-[#EFE5D8] text-[#7C7067] text-xs flex items-center space-x-1 transition-colors cursor-pointer"
                  title="Dismiss suggestion without breaking the entry or preventing manual edits"
                >
                  <EyeOff className="w-3 h-3" />
                  <span>Dismiss</span>
                </button>
                <button
                  type="button"
                  onClick={handleKeepThoughtInEntry}
                  className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center space-x-1 transition-colors shadow-xs cursor-pointer ${
                    isThoughtKept
                      ? 'bg-[#4D7C5F] text-[#FFFDF9]'
                      : 'bg-[#C97C4C] hover:bg-[#B46A3B] text-[#FFFDF9]'
                  }`}
                >
                  <Check className="w-3 h-3" />
                  <span>{isThoughtKept ? 'Kept in Entry' : 'Keep in Entry'}</span>
                </button>
              </div>
            </div>
            <p className="font-serif italic text-sm sm:text-base text-[#2B231F] leading-relaxed">
              "{suggestedThought}"
            </p>
          </div>
        )}

        {/* Dismissed Suggestion State - Only rendered when AI is explicitly permitted */}
        {isAIPermitted && suggestedThought && isSuggestionDismissed && (
          <div className="bg-[#FAF5EC] border border-[#EFE7D8] rounded-2xl p-3 flex items-center justify-between text-xs text-[#7C7067] animate-fade-in">
            <div className="flex items-center space-x-2">
              <EyeOff className="w-3.5 h-3.5 text-[#8C8075]" />
              <span className="font-serif italic">1 gentle thought hidden for this view</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setIsSuggestionDismissed(false)}
                className="text-xs text-[#7C7067] hover:text-[#2B231F] underline cursor-pointer"
              >
                Review
              </button>
              <button
                type="button"
                onClick={handleKeepThoughtInEntry}
                className="px-2.5 py-1 rounded-lg bg-[#C97C4C] hover:bg-[#B46A3B] text-[#FFFDF9] font-medium flex items-center space-x-1 shadow-xs transition-colors cursor-pointer"
              >
                <Check className="w-3 h-3" />
                <span>Keep in Entry</span>
              </button>
            </div>
          </div>
        )}

        {/* Mobile-Responsive Formatting Toolbar (< 380px horizontal scroll supported via no-scrollbar) */}
        <div className="w-full overflow-x-auto no-scrollbar scroll-smooth py-1 px-0.5 flex items-center space-x-1.5 border-b border-[#EFE7D8] flex-nowrap whitespace-nowrap touch-pan-x">
          <button
            type="button"
            onClick={() => insertFormatting('**', '**')}
            title="Bold (**text**)"
            className="h-8 px-2.5 rounded-lg bg-[#FAF6EE] hover:bg-[#F0E6D5] text-[#2B231F] text-xs font-bold border border-[#EAE1CF] flex items-center space-x-1 flex-shrink-0 transition-colors cursor-pointer"
          >
            <Bold className="w-3.5 h-3.5" />
            <span className="text-[11px]">Bold</span>
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('*', '*')}
            title="Italic (*text*)"
            className="h-8 px-2.5 rounded-lg bg-[#FAF6EE] hover:bg-[#F0E6D5] text-[#2B231F] text-xs italic border border-[#EAE1CF] flex items-center space-x-1 flex-shrink-0 transition-colors cursor-pointer"
          >
            <Italic className="w-3.5 h-3.5" />
            <span className="text-[11px]">Italic</span>
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('<u>', '</u>')}
            title="Underline (<u>text</u>)"
            className="h-8 px-2.5 rounded-lg bg-[#FAF6EE] hover:bg-[#F0E6D5] text-[#2B231F] text-xs underline border border-[#EAE1CF] flex items-center space-x-1 flex-shrink-0 transition-colors cursor-pointer"
          >
            <Underline className="w-3.5 h-3.5" />
            <span className="text-[11px]">Underline</span>
          </button>
          <div className="h-4 w-[1px] bg-[#E0D5C0] flex-shrink-0 mx-0.5" />
          <button
            type="button"
            onClick={() => insertFormatting('- ')}
            title="Bullet List (- item)"
            className="h-8 px-2.5 rounded-lg bg-[#FAF6EE] hover:bg-[#F0E6D5] text-[#2B231F] text-xs border border-[#EAE1CF] flex items-center space-x-1 flex-shrink-0 transition-colors cursor-pointer"
          >
            <List className="w-3.5 h-3.5" />
            <span className="text-[11px]">List</span>
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('1. ')}
            title="Numbered List (1. item)"
            className="h-8 px-2.5 rounded-lg bg-[#FAF6EE] hover:bg-[#F0E6D5] text-[#2B231F] text-xs border border-[#EAE1CF] flex items-center space-x-1 flex-shrink-0 transition-colors cursor-pointer"
          >
            <ListOrdered className="w-3.5 h-3.5" />
            <span className="text-[11px]">Numbered</span>
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('> ')}
            title="Blockquote (> quote)"
            className="h-8 px-2.5 rounded-lg bg-[#FAF6EE] hover:bg-[#F0E6D5] text-[#2B231F] text-xs border border-[#EAE1CF] flex items-center space-x-1 flex-shrink-0 transition-colors cursor-pointer"
          >
            <Quote className="w-3.5 h-3.5" />
            <span className="text-[11px]">Quote</span>
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('\n---\n')}
            title="Horizontal Divider (---)"
            className="h-8 px-2.5 rounded-lg bg-[#FAF6EE] hover:bg-[#F0E6D5] text-[#2B231F] text-xs border border-[#EAE1CF] flex items-center space-x-1 flex-shrink-0 transition-colors cursor-pointer"
          >
            <Minus className="w-3.5 h-3.5" />
            <span className="text-[11px]">Divider</span>
          </button>
        </div>

        {/* Writing Surface / Freeform Text Area */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            rows={12}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Write your thoughts freely here, or click the mic button at the top right corner to dictate in ${currentLang.label}...`}
            className="w-full notebook-lines font-serif text-base text-[#2B231F] placeholder:text-[#A89C8F] border-none bg-transparent focus:outline-hidden resize-y leading-7 selection:bg-[#C97C4C]/25"
          />
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

      {/* Template Switch Confirmation Dialog (Protects Typed Prompt Answers) */}
      {pendingTemplateId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-[#FFFDF9] border border-[#E8DFC8] rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-xl space-y-4">
            <div className="flex items-center space-x-2.5 text-[#C97C4C]">
              <AlertCircle className="w-5 h-5 text-[#C97C4C] flex-shrink-0" />
              <h4 className="font-display font-semibold text-lg text-[#2B231F]">
                Switch template?
              </h4>
            </div>
            <p className="text-xs sm:text-sm text-[#6B5A4E] font-serif leading-relaxed">
              Switching templates will clear your current prompt answers. Do you want to keep your current template or switch?
            </p>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={handleCancelTemplateSwitch}
                className="w-full py-2.5 px-4 rounded-xl bg-[#EFE8D8] hover:bg-[#E5DAC8] text-[#2B231F] text-xs font-semibold transition-colors cursor-pointer"
              >
                Keep Current Template
              </button>
              <button
                type="button"
                onClick={handleConfirmTemplateSwitch}
                className="w-full py-2.5 px-4 rounded-xl bg-[#C97C4C] hover:bg-[#B46A3B] text-[#FFFDF9] text-xs font-semibold transition-colors shadow-xs cursor-pointer"
              >
                Switch Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suggested Template Recommendation Popup */}
      {suggestedModalData && (
        <SuggestedTemplateModal
          suggestion={suggestedModalData}
          onUseSuggestedTemplate={handleUseSuggestedTemplate}
          onSelectAnyTemplate={handleSelectAnyTemplate}
          onClose={handleCloseSuggestionModal}
        />
      )}
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Send, 
  Mic, 
  MicOff, 
  X, 
  Check, 
  Lightbulb, 
  RotateCcw,
  BookOpen,
  BookmarkCheck,
  MessageCircle,
  Compass,
  ArrowRight,
  Copy,
  CheckCheck
} from 'lucide-react';
import { generateInteractiveCompanionReply } from '../utils/companionDialogueEngine';

export interface InquiryNote {
  question: string;
  answer: string;
  companionReply?: string;
  answeredAt: number;
}

export interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: number;
  modelUsed?: string;
}

interface WeeklyInquiryChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  weekLabel: string;
  questions: string[];
  moodTrendSummary: string;
  existingNotes?: InquiryNote[];
  onSaveInquiryAnswers: (notes: InquiryNote[], formattedNoteText: string) => void;
}

// Format conversation insights into a clean, markdown-friendly reflection note
export function formatInquiriesToNote(notes: InquiryNote[]): string {
  if (!notes || notes.length === 0) return '';
  const lines: string[] = ['🌱 Weekly Inquiries & Realizations:'];
  notes.forEach((n, idx) => {
    lines.push(`\n• Inquiry #${idx + 1}: ${n.question}`);
    lines.push(`  Reflection: ${n.answer}`);
    if (n.companionReply) {
      lines.push(`  Companion Note: "${n.companionReply}"`);
    }
  });
  return lines.join('\n');
}

// Convert conversation messages into structured InquiryNotes
function extractNotesFromMessages(messages: ChatMessage[], defaultQuestion: string): InquiryNote[] {
  const notes: InquiryNote[] = [];
  
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (msg.sender === 'user') {
      // Find the prompt or previous AI message that inspired this
      const prevAiMsg = i > 0 && messages[i - 1].sender === 'ai' ? messages[i - 1].text : defaultQuestion;
      const nextAiMsg = i + 1 < messages.length && messages[i + 1].sender === 'ai' ? messages[i + 1].text : undefined;
      
      notes.push({
        question: prevAiMsg.length > 120 ? `${prevAiMsg.slice(0, 117)}...` : prevAiMsg,
        answer: msg.text,
        companionReply: nextAiMsg,
        answeredAt: msg.timestamp,
      });
    }
  }

  return notes;
}

export const WeeklyInquiryChatModal: React.FC<WeeklyInquiryChatModalProps> = ({
  isOpen,
  onClose,
  weekLabel,
  questions,
  moodTrendSummary,
  existingNotes = [],
  onSaveInquiryAnswers,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [savedFeedback, setSavedFeedback] = useState<boolean>(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [showConfirmReset, setShowConfirmReset] = useState<boolean>(false);
  const [dynamicChips, setDynamicChips] = useState<string[]>([]);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const wasOpenRef = useRef<boolean>(false);

  const storageKey = `hearthnote_weekly_chat_${weekLabel.replace(/[^a-zA-Z0-9]/g, '_')}`;

  const validQuestions = (questions && questions.length > 0)
    ? questions
    : [
        'What small pause supported you most this week?',
        'Which feeling would you like to welcome more in the coming days?',
      ];

  // Initialize chat STRICTLY only when the modal is opened from closed state
  useEffect(() => {
    if (!isOpen) {
      wasOpenRef.current = false;
      return;
    }

    // Only run on open transition, not on every prop update while already open
    if (wasOpenRef.current) return;
    wasOpenRef.current = true;

    // 1. Check if we have an ongoing conversation saved in localStorage for this week
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          setDynamicChips([
            'What was my biggest lesson from this week?',
            'How can I bring more calm to tomorrow?',
            'Help me unpack why I felt stressed'
          ]);
          setTimeout(() => {
            if (textareaRef.current) textareaRef.current.focus();
          }, 200);
          return;
        }
      }
    } catch (e) {
      console.warn('Could not parse saved chat from localStorage:', e);
    }

    // 2. If existing notes were previously saved for this week, restore them into dialogue flow
    if (existingNotes && existingNotes.length > 0) {
      const history: ChatMessage[] = [
        {
          id: 'welcome-past',
          sender: 'ai',
          text: `Welcome back to our reflection dialogue for ${weekLabel}. Here are the thoughts we explored together:`,
          timestamp: Date.now() - 3000,
        },
      ];

      existingNotes.forEach((n, idx) => {
        history.push({
          id: `past-q-${idx}`,
          sender: 'ai',
          text: n.question,
          timestamp: n.answeredAt - 2000,
        });
        history.push({
          id: `past-a-${idx}`,
          sender: 'user',
          text: n.answer,
          timestamp: n.answeredAt - 1000,
        });
        if (n.companionReply) {
          history.push({
            id: `past-r-${idx}`,
            sender: 'ai',
            text: n.companionReply,
            timestamp: n.answeredAt,
          });
        }
      });

      history.push({
        id: 'continue-prompt',
        sender: 'ai',
        text: "I am right here whenever you'd like to continue our conversation. What else from this week is lingering in your mind?",
        timestamp: Date.now(),
      });

      setMessages(history);
      setDynamicChips([
        'How can I build on this progress next week?',
        'What should I prioritize for my well-being?',
        'Summarize our conversation so far'
      ]);
    } else {
      // 3. Start a fresh, personalized conversational opening
      const openingGreeting: ChatMessage = {
        id: `opening-${Date.now()}`,
        sender: 'ai',
        text: `Hello, I'm your dedicated reflection companion for ${weekLabel}. Looking over your weekly journal rhythm (${moodTrendSummary || 'a thoughtful period of reflection'}), I am here to help you unpack your thoughts and uncover what these days held for you.\n\n${validQuestions[0] || 'How are you feeling as you look back on this week?'}`,
        timestamp: Date.now(),
      };

      setMessages([openingGreeting]);
      setDynamicChips([
        validQuestions[0] || 'What brought me peace this week?',
        'I felt really busy and overwhelmed mid-week',
        'What was the highlight of my week?',
        'How can I set better boundaries?'
      ]);
    }

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 250);
  }, [isOpen, weekLabel, moodTrendSummary, storageKey]);

  // Persist messages to localStorage whenever they change
  useEffect(() => {
    if (!isOpen || messages.length === 0) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    } catch (e) {
      console.warn('Failed to persist weekly chat:', e);
    }
  }, [messages, isOpen, storageKey]);

  // Auto-scroll on new messages or thinking state
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isAiThinking]);

  // Speech Recognition setup (Voice to text)
  const toggleSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechError('Speech recognition is not supported in this browser.');
      setTimeout(() => setSpeechError(null), 3500);
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = navigator.language || 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
          }
        }
        if (finalTranscript) {
          setInputText((prev) => (prev ? `${prev} ${finalTranscript.trim()}` : finalTranscript.trim()));
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setSpeechError('Microphone permission was denied.');
        } else {
          setSpeechError('Speech recognition stopped.');
        }
        setIsListening(false);
        setTimeout(() => setSpeechError(null), 3500);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('Speech recognition start failed:', err);
      setIsListening(false);
    }
  };

  // Stop listening when unmounted or closed
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Handle sending a message in the continuous conversation
  const handleSendMessage = async (textOverride?: string) => {
    const textToSend = (textOverride !== undefined ? textOverride : inputText).trim();
    if (!textToSend || isAiThinking) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    // 1. Append user message to thread
    const userMsgId = `user-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: textToSend,
      timestamp: Date.now(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputText('');
    setIsAiThinking(true);

    let companionReply = '';
    let followUps: string[] = [];

    try {
      // 2. Call server endpoint with timeout fallback to ensure instant responsiveness
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);

      const resp = await fetch('/api/gemini/inquiry-dialogue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: textToSend,
          messages: updatedMessages.map((m) => ({
            sender: m.sender,
            text: m.text,
          })),
          weekLabel,
          moodTrendSummary,
          questions: validQuestions,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (resp.ok) {
        const data = await resp.json();
        if (data.companionReply && typeof data.companionReply === 'string' && data.companionReply.trim()) {
          companionReply = data.companionReply.trim();
        }
      }
    } catch (err) {
      console.info('[Weekly Inquiry] Fast interactive engine active.');
    }

    // 3. Guaranteed instant synthesis fallback if server is slow, offline, or quota-constrained
    if (!companionReply) {
      const localResult = generateInteractiveCompanionReply(
        textToSend,
        updatedMessages,
        { weekLabel, moodSummary: moodTrendSummary, questions: validQuestions }
      );
      companionReply = localResult.companionReply;
      followUps = localResult.suggestedFollowUps;
    } else {
      const localResult = generateInteractiveCompanionReply(
        textToSend,
        updatedMessages,
        { weekLabel, moodSummary: moodTrendSummary, questions: validQuestions }
      );
      followUps = localResult.suggestedFollowUps;
    }

    // 4. Append companion reply
    const aiReplyMsg: ChatMessage = {
      id: `ai-${Date.now()}`,
      sender: 'ai',
      text: companionReply,
      timestamp: Date.now(),
      modelUsed: 'Hearth Companion',
    };

    const finalMessages = [...updatedMessages, aiReplyMsg];
    setMessages(finalMessages);
    setIsAiThinking(false);

    if (followUps && followUps.length > 0) {
      setDynamicChips(followUps);
    }

    // 5. Automatically synchronize structured notes to parent reflection state
    try {
      const structuredNotes = extractNotesFromMessages(finalMessages, validQuestions[0]);
      if (structuredNotes.length > 0) {
        const formatted = formatInquiriesToNote(structuredNotes);
        onSaveInquiryAnswers(structuredNotes, formatted);
      }
    } catch (saveErr) {
      console.warn('Silent note sync error:', saveErr);
    }

    setTimeout(() => {
      if (textareaRef.current) textareaRef.current.focus();
    }, 100);
  };

  // Explicitly save the current conversation insights to weekly reflection note
  const handleSaveConversationToNotes = () => {
    const structuredNotes = extractNotesFromMessages(messages, validQuestions[0]);
    if (structuredNotes.length === 0) return;

    const formatted = formatInquiriesToNote(structuredNotes);
    onSaveInquiryAnswers(structuredNotes, formatted);
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 3000);
  };

  // Copy individual message text
  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  // Reset conversation to fresh start
  const handleResetConversation = () => {
    setShowConfirmReset(false);
    localStorage.removeItem(storageKey);
    const freshOpening: ChatMessage = {
      id: `fresh-opening-${Date.now()}`,
      sender: 'ai',
      text: `Let's begin a fresh reflection for ${weekLabel}. ${validQuestions[0] || 'What is on your heart as you look back on your week?'}`,
      timestamp: Date.now(),
    };
    setMessages([freshOpening]);
    setInputText('');
    setDynamicChips([
      validQuestions[0] || 'What brought me peace this week?',
      'Why did I feel so tired mid-week?',
      'What was my favorite quiet moment?',
      'Help me set an intention for next week'
    ]);
  };

  if (!isOpen) return null;

  return (
    <div 
      id="weekly-inquiry-chat-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/45 backdrop-blur-xs animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="weekly-inquiry-title"
    >
      <div className="relative w-full max-w-2xl bg-[#FAF6EE] border border-[#E8DFC8] rounded-3xl shadow-2xl flex flex-col h-[90vh] max-h-[750px] overflow-hidden">
        
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#EFE7D8] bg-[#FAF4E6] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-2xl bg-[#C97C4C]/15 border border-[#C97C4C]/30 flex items-center justify-center text-[#C97C4C] shadow-2xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 
                  id="weekly-inquiry-title"
                  className="text-sm sm:text-base font-serif font-bold text-[#2B231F]"
                >
                  Talk Through This Week
                </h3>
                <span className="hidden sm:inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-[#EBF3ED] text-[#4D7C5F] text-[10px] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4D7C5F] animate-pulse" />
                  <span>Friendly Reflection</span>
                </span>
              </div>
              <p className="text-[11px] text-[#7A6B63]">
                Explore what stood out, how you felt, and what your week might be telling you.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            {/* Save insights to note button */}
            <button
              id="save-conversation-to-note-btn"
              onClick={handleSaveConversationToNotes}
              title="Save conversation insights to Weekly Reflection note"
              className={`px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center space-x-1.5 transition-all cursor-pointer ${
                savedFeedback
                  ? 'bg-[#EBF3ED] border-[#A7D0B2] text-[#2F6542]'
                  : 'bg-[#FFFDF9] border-[#E0D5C1] hover:bg-[#FAF0E8] text-[#5A4D45] hover:text-[#C97C4C]'
              }`}
            >
              {savedFeedback ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#4D7C5F]" />
                  <span className="hidden sm:inline">Saved to Note</span>
                </>
              ) : (
                <>
                  <BookmarkCheck className="w-3.5 h-3.5 text-[#C97C4C]" />
                  <span className="hidden sm:inline">Save to Note</span>
                </>
              )}
            </button>

            {/* Clear/Restart conversation button */}
            <button
              id="restart-chat-btn"
              onClick={() => setShowConfirmReset(true)}
              title="Clear and restart conversation"
              className="p-1.5 rounded-xl border border-[#E0D5C1] hover:bg-[#FAF0E8] text-[#7A6B63] hover:text-[#C97C4C] transition-colors cursor-pointer"
              aria-label="Restart chat"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Close modal */}
            <button
              id="close-weekly-inquiry-chat-btn"
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-[#EFE7D8] text-[#7A6B63] hover:text-[#2B231F] transition-colors cursor-pointer ml-1"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Reset Confirmation Bar */}
        {showConfirmReset && (
          <div className="px-4 py-2.5 bg-[#FFF8EE] border-b border-[#F5E6CC] flex items-center justify-between text-xs text-[#7A5B35] animate-fade-in">
            <span>Clear conversation history and start fresh for this week?</span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowConfirmReset(false)}
                className="px-2.5 py-1 rounded-lg text-xs font-medium hover:bg-[#EFE7D8] text-[#5A4D45]"
              >
                Cancel
              </button>
              <button
                id="confirm-reset-chat-btn"
                onClick={handleResetConversation}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#C97C4C] text-white hover:bg-[#B3693A]"
              >
                Yes, Start Fresh
              </button>
            </div>
          </div>
        )}

        {/* Chat Thread */}
        <div 
          ref={chatContainerRef}
          className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 text-xs sm:text-sm font-serif"
        >
          {messages.map((msg) => {
            const isAi = msg.sender === 'ai';

            return (
              <div
                key={msg.id}
                className={`group flex items-end space-x-2.5 ${isAi ? 'justify-start' : 'justify-end'} animate-fade-in`}
              >
                {isAi && (
                  <div className="w-7 h-7 rounded-full bg-[#EFE7D8] border border-[#E0D5C1] flex items-center justify-center text-[#7A6B63] shrink-0 mb-1 shadow-2xs">
                    <Sparkles className="w-3.5 h-3.5 text-[#C97C4C]" />
                  </div>
                )}
                
                <div
                  className={`relative max-w-[85%] sm:max-w-[78%] px-4 py-3 rounded-2xl leading-relaxed text-xs sm:text-sm ${
                    isAi
                      ? 'bg-[#F2ECE1] text-[#2B231F] rounded-bl-xs border border-[#E5DAC4] shadow-2xs'
                      : 'bg-[#C97C4C] text-white rounded-br-xs shadow-xs'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  
                  <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-black/5 text-[10px] font-sans">
                    <span className={isAi ? 'text-[#8C7E76]' : 'text-white/70'}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>

                    {/* Copy message button */}
                    <button
                      onClick={() => handleCopyMessage(msg.id, msg.text)}
                      title="Copy text"
                      className={`ml-2 p-0.5 rounded opacity-60 hover:opacity-100 transition-opacity cursor-pointer ${
                        isAi ? 'text-[#7A6B63] hover:text-[#2B231F]' : 'text-white/80 hover:text-white'
                      }`}
                    >
                      {copiedMessageId === msg.id ? (
                        <CheckCheck className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {isAiThinking && (
            <div className="flex items-center space-x-2.5 text-[#7A6B63] text-xs pt-1 animate-fade-in">
              <div className="w-7 h-7 rounded-full bg-[#EFE7D8] flex items-center justify-center shrink-0 border border-[#E0D5C1]">
                <Sparkles className="w-3.5 h-3.5 text-[#C97C4C] animate-spin" />
              </div>
              <div className="px-4 py-2.5 rounded-2xl bg-[#F2ECE1] border border-[#E5DAC4] text-xs italic font-sans flex items-center space-x-2 text-[#5A4D45] shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-[#C97C4C] animate-ping" />
                <span>Hearth Companion is reflecting on your words...</span>
              </div>
            </div>
          )}
        </div>

        {/* Speech Recognition Error Banner */}
        {speechError && (
          <div className="px-4 py-1.5 bg-[#FEF2F2] border-t border-[#FECACA] text-[11px] text-[#991B1B] text-center font-sans">
            {speechError}
          </div>
        )}

        {/* Dynamic Conversation Starter & Follow-up Chips */}
        <div className="px-4 py-2 bg-[#F7F1E4] border-t border-[#EFE7D8] overflow-x-auto no-scrollbar flex items-center space-x-2 shrink-0">
          <span className="text-[11px] font-sans font-semibold text-[#8C7E76] uppercase tracking-wider whitespace-nowrap flex items-center space-x-1 shrink-0">
            <Lightbulb className="w-3 h-3 text-[#C97C4C]" />
            <span>Reflect On:</span>
          </span>
          {dynamicChips.map((chipText, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(chipText)}
              disabled={isAiThinking}
              className="px-3 py-1 rounded-full bg-[#FFFDF9] hover:bg-[#FAF0E8] border border-[#E0D5C1] hover:border-[#C97C4C]/40 text-[#4A3F39] hover:text-[#C97C4C] text-[11px] font-sans whitespace-nowrap shadow-2xs transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50 shrink-0"
            >
              <span className="truncate max-w-[240px]">{chipText}</span>
              <ArrowRight className="w-2.5 h-2.5 text-[#C97C4C]" />
            </button>
          ))}
        </div>

        {/* Footer / Continuous Input Bar */}
        <div className="p-3 sm:p-4 border-t border-[#EFE7D8] bg-[#FAF4E6]">
          <div className="space-y-2">
            <div className="relative flex items-center">
              <textarea
                ref={textareaRef}
                id="inquiry-chat-input"
                rows={2}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Share your thoughts, ask a question, or explore this week... (Press Enter to send)"
                disabled={isAiThinking}
                className="w-full bg-[#FFFDF9] border border-[#E0D5C1] rounded-2xl p-3 pr-22 text-xs sm:text-sm text-[#2B231F] placeholder:text-[#A89C8F] font-serif focus:outline-none focus:ring-1.5 focus:ring-[#C97C4C] resize-none leading-relaxed shadow-2xs"
              />

              <div className="absolute right-2.5 bottom-2.5 flex items-center space-x-1.5">
                {/* Voice speech-to-text button */}
                <button
                  type="button"
                  id="inquiry-chat-mic-btn"
                  onClick={toggleSpeechRecognition}
                  title={isListening ? 'Stop recording voice' : 'Speak your thoughts'}
                  className={`p-2 rounded-xl transition-all cursor-pointer ${
                    isListening
                      ? 'bg-[#EF4444] text-white animate-pulse'
                      : 'text-[#7A6B63] hover:text-[#2B231F] hover:bg-[#EFE7D8]'
                  }`}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                {/* Send button */}
                <button
                  type="button"
                  id="inquiry-chat-send-btn"
                  onClick={() => handleSendMessage()}
                  disabled={!inputText.trim() || isAiThinking}
                  className="p-2 rounded-xl bg-[#C97C4C] hover:bg-[#B3693A] text-white disabled:opacity-35 transition-all shadow-xs cursor-pointer"
                  aria-label="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#8C7D73] font-sans px-1">
              <span>Shift + Enter for a new line · Interactive dialogue with Hearth Companion</span>
              <button
                onClick={handleSaveConversationToNotes}
                className="text-[#C97C4C] hover:underline font-medium cursor-pointer"
              >
                Save to Weekly Note
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

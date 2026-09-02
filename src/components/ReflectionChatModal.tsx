import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Send, 
  X, 
  Check, 
  MessageSquare, 
  HelpCircle, 
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import type { ChatMessage, ReflectionChatSession, WeeklyReflection } from '../types';

interface ReflectionChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  weeklyReflection: WeeklyReflection | null;
  onSaveSession: (session: ReflectionChatSession) => Promise<void>;
  userId: string;
}

export const ReflectionChatModal: React.FC<ReflectionChatModalProps> = ({
  isOpen,
  onClose,
  weeklyReflection,
  onSaveSession,
  userId,
}) => {
  // Questions from the weekly reflection
  const questions = weeklyReflection?.reflectionQuestions && weeklyReflection.reflectionQuestions.length > 0
    ? weeklyReflection.reflectionQuestions
    : [
        "What small pause or moment supported you most this week?",
        "Where did you feel most grounded and at ease?",
        "What is one feeling you would like to hold with gentle compassion today?"
      ];

  const firstQuestion = questions[0];
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
  const activeQuestion = questions[selectedQuestionIndex] || firstQuestion;

  // Chat message state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<number>(Date.now());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmCloseWithoutSaving, setConfirmCloseWithoutSaving] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize or reset chat when modal opens
  useEffect(() => {
    if (isOpen) {
      setSessionStartTime(Date.now());
      setConfirmCloseWithoutSaving(false);
      setErrorMessage(null);

      // Pre-seed initial greeting based on the first inquiry
      const initialGreeting: ChatMessage = {
        id: `ai-init-${Date.now()}`,
        sender: 'ai',
        text: `Welcome to your quiet reflection companion. I've been sitting with your weekly mirror.\n\nHere is our starting inquiry to explore together:\n\n"${firstQuestion}"\n\nTake your time. What thoughts or feelings softly rise up as you consider this?`,
        timestamp: Date.now(),
        questionIndex: 0,
      };

      setMessages([initialGreeting]);
      setSelectedQuestionIndex(0);

      // Focus input
      setTimeout(() => {
        inputRef.current?.focus();
      }, 250);
    }
  }, [isOpen, firstQuestion]);

  // Auto-scroll to latest message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isOpen]);

  if (!isOpen) return null;

  // Handle switching reflection questions
  const handleSelectQuestion = (idx: number) => {
    if (idx === selectedQuestionIndex) return;
    setSelectedQuestionIndex(idx);
    const chosenQ = questions[idx];
    
    // Add transition message
    const transitionMsg: ChatMessage = {
      id: `ai-switch-${Date.now()}`,
      sender: 'ai',
      text: `Let's gently turn our attention to inquiry #${idx + 1}:\n\n"${chosenQ}"\n\nHow does this question resonate with what you are experiencing?`,
      timestamp: Date.now(),
      questionIndex: idx,
    };
    setMessages((prev) => [...prev, transitionMsg]);
  };

  // Handle sending a user message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanText = inputText.trim();
    if (!cleanText || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: cleanText,
      timestamp: Date.now(),
      questionIndex: selectedQuestionIndex,
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputText('');
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const resp = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: cleanText,
          history: newHistory.map((m) => ({ sender: m.sender, text: m.text })),
          reflectionQuestion: activeQuestion,
          reflectionSummary: weeklyReflection?.moodTrendSummary || '',
          themes: weeklyReflection?.themes || [],
        }),
      });

      if (!resp.ok) {
        throw new Error(`Server responded with status ${resp.status}`);
      }

      const data = await resp.json();
      const aiReply: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: data.reply || "Thank you for sharing your thoughts with me. Let's hold that with kindness.",
        timestamp: Date.now(),
        questionIndex: selectedQuestionIndex,
      };

      setMessages((prev) => [...prev, aiReply]);
    } catch (err: any) {
      console.error('Chat error:', err);
      // Fallback message so user isn't stuck
      const fallbackMsg: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        sender: 'ai',
        text: "Thank you for sharing that thought with me. Sitting quietly with what is true right now gives your mind room to settle.",
        timestamp: Date.now(),
        questionIndex: selectedQuestionIndex,
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  // Handle completing and saving the conversation
  const handleCompleteAndSave = async () => {
    // Check if user had at least 1 user message
    const userMessagesCount = messages.filter((m) => m.sender === 'user').length;
    if (userMessagesCount === 0) {
      onClose();
      return;
    }

    setIsSaving(true);
    try {
      // Create session title based on the first inquiry explored
      const cleanTitle = `Reflection on: ${firstQuestion.slice(0, 55)}${firstQuestion.length > 55 ? '...' : ''}`;
      
      const session: ReflectionChatSession = {
        id: `chat-session-${Date.now()}`,
        userId: userId || 'guest',
        title: cleanTitle,
        weeklyReflectionId: weeklyReflection?.id,
        weeklyReflectionDate: weeklyReflection ? `${weeklyReflection.weekStartDate} — ${weeklyReflection.weekEndDate}` : undefined,
        firstQuestion,
        messages,
        messageCount: messages.length,
        createdAt: sessionStartTime,
        completedAt: Date.now(),
      };

      await onSaveSession(session);
      onClose();
    } catch (err: any) {
      console.error('Failed to save dialogue session:', err);
      setErrorMessage(err?.message || 'Failed to save completed dialogue.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAttemptClose = () => {
    const userMessagesCount = messages.filter((m) => m.sender === 'user').length;
    if (userMessagesCount > 0 && !confirmCloseWithoutSaving) {
      setConfirmCloseWithoutSaving(true);
    } else {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#1E1915]/60 backdrop-blur-xs animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reflection-chat-title"
    >
      <div 
        className="bg-[#FFFDF9] border border-[#DDD0BC] rounded-3xl w-full max-w-2xl h-[88vh] sm:h-[82vh] max-h-[750px] shadow-2xl flex flex-col overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 bg-[#FAF6EE] border-b border-[#E8DFC8] flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-2xl bg-[#FAF0E8] border border-[#EAD6C7] flex items-center justify-center text-[#C97C4C] shadow-2xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 id="reflection-chat-title" className="font-display text-base font-semibold text-[#2B231F]">
                  AI Reflection Companion
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#FAF0E8] text-[#8C5230] border border-[#EAD6C7]">
                  Pop-up
                </span>
              </div>
              <p className="text-[11px] text-[#7C7067] font-serif">
                A quiet conversational dialogue exploring your weekly mirror inquiries.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Complete & Save Action Button */}
            <button
              id="complete-save-dialogue-btn"
              onClick={handleCompleteAndSave}
              disabled={isSaving || messages.filter((m) => m.sender === 'user').length === 0}
              className="px-3.5 py-1.5 rounded-xl bg-[#C97C4C] hover:bg-[#B46A3B] text-[#FFFDF9] text-xs font-semibold shadow-xs transition-all flex items-center space-x-1.5 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              title="Save conversation to your Reflection Dialogues section"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Complete & Save'}</span>
            </button>

            {/* Close Button */}
            <button
              onClick={handleAttemptClose}
              className="w-8 h-8 rounded-xl text-[#7C7067] hover:text-[#2B231F] hover:bg-[#EFE8D8] flex items-center justify-center transition-colors"
              aria-label="Close reflection chat pop-up"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Question Selector Banner */}
        <div className="px-5 py-2.5 bg-[#FAF0E8]/50 border-b border-[#EFE5D3] flex items-center gap-2 overflow-x-auto shrink-0 scrollbar-none">
          <span className="text-[11px] font-semibold text-[#8C5230] whitespace-nowrap flex items-center space-x-1">
            <HelpCircle className="w-3 h-3 text-[#C97C4C]" />
            <span>Weekly Inquiries:</span>
          </span>
          {questions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectQuestion(idx)}
              className={`text-[11px] px-2.5 py-1 rounded-lg transition-all truncate max-w-[210px] shrink-0 font-medium ${
                selectedQuestionIndex === idx
                  ? 'bg-[#C97C4C] text-white shadow-2xs font-semibold'
                  : 'bg-[#FFFDF9] text-[#594C44] border border-[#E2D4BF] hover:border-[#C97C4C]'
              }`}
              title={q}
            >
              #{idx + 1}: {q}
            </button>
          ))}
        </div>

        {/* Close Confirmation Notice */}
        {confirmCloseWithoutSaving && (
          <div className="px-5 py-2.5 bg-[#FAF0E8] border-b border-[#EAD6C7] flex items-center justify-between text-xs text-[#8C5230] animate-fade-in shrink-0">
            <div className="flex items-center space-x-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-[#C97C4C]" />
              <span>You have unsaved messages. Would you like to complete and store this dialogue?</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleCompleteAndSave}
                className="px-2.5 py-1 rounded-lg bg-[#C97C4C] text-white font-semibold text-[11px] shadow-2xs"
              >
                Save Dialogue
              </button>
              <button
                onClick={onClose}
                className="px-2 py-1 rounded-lg text-[#7C7067] hover:text-[#2B231F] text-[11px] underline"
              >
                Discard & Close
              </button>
            </div>
          </div>
        )}

        {/* Error notification */}
        {errorMessage && (
          <div className="px-5 py-2 bg-red-50 border-b border-red-200 text-xs text-red-700 flex items-center justify-between shrink-0">
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="text-red-500 hover:text-red-700">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Chat Message Scrollable Area */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-[#FFFDF9]">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}
              >
                <div className="flex items-center space-x-1.5 px-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#8C8075]">
                    {isUser ? 'You' : 'Companion'}
                  </span>
                  <span className="text-[10px] text-[#A6998E]">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div
                  className={`max-w-[85%] sm:max-w-[80%] rounded-2xl p-4 text-xs sm:text-sm font-serif leading-relaxed shadow-2xs whitespace-pre-wrap ${
                    isUser
                      ? 'bg-[#C97C4C] text-[#FFFDF9] rounded-tr-xs'
                      : 'bg-[#FAF6EE] text-[#2B231F] border border-[#EAE1CF] rounded-tl-xs'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })}

          {/* Typing / Loading indicator */}
          {isLoading && (
            <div className="flex flex-col items-start space-y-1">
              <div className="flex items-center space-x-1.5 px-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#C97C4C]">
                  Companion
                </span>
                <span className="text-[10px] text-[#A6998E]">Listening...</span>
              </div>
              <div className="bg-[#FAF6EE] border border-[#EAE1CF] rounded-2xl rounded-tl-xs p-4 flex items-center space-x-2 text-xs text-[#7C7067] shadow-2xs">
                <div className="w-1.5 h-1.5 rounded-full bg-[#C97C4C] animate-pulse" />
                <div className="w-1.5 h-1.5 rounded-full bg-[#C97C4C] animate-pulse delay-150" />
                <div className="w-1.5 h-1.5 rounded-full bg-[#C97C4C] animate-pulse delay-300" />
                <span className="text-[11px] font-serif italic text-[#7C7067] ml-1">
                  Sitting with your thought...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3.5 bg-[#FAF6EE] border-t border-[#E8DFC8] shrink-0">
          <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Share what is gently on your mind..."
              disabled={isLoading || isSaving}
              className="flex-1 bg-[#FFFDF9] border border-[#DDD0BC] rounded-xl px-4 py-2.5 text-xs sm:text-sm font-serif text-[#2B231F] placeholder:text-[#9E9187] focus:outline-hidden focus:ring-1 focus:ring-[#C97C4C] focus:border-[#C97C4C] transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading || isSaving}
              className="p-2.5 rounded-xl bg-[#C97C4C] hover:bg-[#B46A3B] text-white shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 shrink-0"
              aria-label="Send message to AI companion"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          <div className="flex items-center justify-between text-[10px] text-[#8C8075] mt-2 px-1">
            <span>Tap "Complete & Save" at top right when finished to archive this session.</span>
            <span>{messages.filter((m) => m.sender === 'user').length} reflections shared</span>
          </div>
        </div>
      </div>
    </div>
  );
};

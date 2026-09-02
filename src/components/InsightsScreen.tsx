import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  RefreshCw, 
  Check, 
  BookOpen, 
  History, 
  Send, 
  MessageSquare, 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  Trash2,
  BookmarkCheck,
  Edit3,
  Maximize2,
  Clock,
  HelpCircle,
  Plus
} from 'lucide-react';
import type { JournalEntry, MoodLog, MoodType, WeeklyReflection, ReflectionChatSession } from '../types';
import { MOODS, JOURNAL_TEMPLATES } from '../data/templates';
import { ReflectionChatModal } from './ReflectionChatModal';
import { WeeklyReflectionModal } from './WeeklyReflectionModal';
import { SavedDialogueDetailModal } from './SavedDialogueDetailModal';

interface InsightsScreenProps {
  entries: JournalEntry[];
  moodLogs: MoodLog[];
  weeklyReflections: WeeklyReflection[];
  reflectionChatSessions?: ReflectionChatSession[];
  onGenerateWeeklyReflection: () => Promise<void>;
  onSaveWeeklyReflection: (reflection: WeeklyReflection) => Promise<void>;
  onDeleteWeeklyReflection?: (reflectionId: string) => Promise<void>;
  onSaveChatSession?: (session: ReflectionChatSession) => Promise<void>;
  onDeleteChatSession?: (sessionId: string) => Promise<void>;
  isGeneratingReflection: boolean;
  streakCount: number;
  initialTab?: 'mirror' | 'history' | 'dialogues';
  onTabChange?: (tab: 'mirror' | 'history' | 'dialogues') => void;
  userId?: string;
}

export const InsightsScreen: React.FC<InsightsScreenProps> = ({
  entries,
  moodLogs,
  weeklyReflections,
  reflectionChatSessions = [],
  onGenerateWeeklyReflection,
  onSaveWeeklyReflection,
  onDeleteWeeklyReflection,
  onSaveChatSession,
  onDeleteChatSession,
  isGeneratingReflection,
  streakCount,
  initialTab = 'mirror',
  onTabChange,
  userId,
}) => {
  const [activeTab, setActiveTab] = useState<'mirror' | 'history' | 'dialogues'>(initialTab);

  // Modal states for pop-ups
  const [showChatModal, setShowChatModal] = useState(false);
  const [showWeeklyModal, setShowWeeklyModal] = useState(false);
  const [weeklyModalReflection, setWeeklyModalReflection] = useState<WeeklyReflection | null>(null);
  const [selectedDialogueSession, setSelectedDialogueSession] = useState<ReflectionChatSession | null>(null);

  // Sync tab with initialTab prop if it changes
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const handleTabSwitch = (tab: 'mirror' | 'history' | 'dialogues') => {
    setActiveTab(tab);
    if (onTabChange) onTabChange(tab);
  };

  // Most recent reflection mirror
  const latestReflection = weeklyReflections.length > 0 ? weeklyReflections[0] : null;

  // Local state for the user's answers to the latest reflection's gentle inquiries
  const [inquiryAnswers, setInquiryAnswers] = useState<Record<string, string>>({});
  const [userGeneralNotes, setUserGeneralNotes] = useState<string>('');
  const [isSavingAnswers, setIsSavingAnswers] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Expanded reflections in History tab
  const [expandedReflectionId, setExpandedReflectionId] = useState<string | null>(
    weeklyReflections.length > 0 ? weeklyReflections[0].id : null
  );
  // History editing state
  const [editingHistoryId, setEditingHistoryId] = useState<string | null>(null);
  const [historyInquiryAnswers, setHistoryInquiryAnswers] = useState<Record<string, string>>({});
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  // Synchronize local answers with latestReflection when it changes
  useEffect(() => {
    if (latestReflection) {
      setInquiryAnswers(latestReflection.inquiryAnswers || {});
      setUserGeneralNotes(latestReflection.userNotes || '');
    }
  }, [latestReflection?.id]);

  // Handle saving inquiry thoughts for the current mirror
  const handleSaveCurrentInquiryAnswers = async () => {
    if (!latestReflection) return;
    setIsSavingAnswers(true);
    try {
      const updatedReflection: WeeklyReflection = {
        ...latestReflection,
        inquiryAnswers: { ...inquiryAnswers },
        userNotes: userGeneralNotes.trim() || undefined,
        savedAt: Date.now(),
      };
      await onSaveWeeklyReflection(updatedReflection);
      setSaveSuccessMsg('Your reflection thoughts have been saved to history.');
      setTimeout(() => setSaveSuccessMsg(null), 3500);
    } catch (err) {
      console.error('Error saving reflection thoughts:', err);
    } finally {
      setIsSavingAnswers(false);
    }
  };

  // Handle saving inquiry thoughts for a historical reflection
  const handleSaveHistoryInquiryAnswers = async (reflection: WeeklyReflection) => {
    setIsSavingAnswers(true);
    try {
      const updatedReflection: WeeklyReflection = {
        ...reflection,
        inquiryAnswers: { ...historyInquiryAnswers },
        savedAt: Date.now(),
      };
      await onSaveWeeklyReflection(updatedReflection);
      setEditingHistoryId(null);
      setSaveSuccessMsg('Updated reflection history record.');
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } catch (err) {
      console.error('Error updating reflection history:', err);
    } finally {
      setIsSavingAnswers(false);
    }
  };

  // Handle inline delete reflection execution
  const handleExecuteDelete = async (reflectionId: string) => {
    if (!onDeleteWeeklyReflection) return;
    setIsDeletingId(reflectionId);
    try {
      await onDeleteWeeklyReflection(reflectionId);
      setDeleteConfirmId(null);
      setSaveSuccessMsg('Reflection record removed from history.');
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } catch (err) {
      console.error('Error deleting weekly reflection:', err);
    } finally {
      setIsDeletingId(null);
    }
  };

  // Mood frequency calculation
  const moodCounts = entries.reduce((acc, entry) => {
    acc[entry.mood] = (acc[entry.mood] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Template frequency calculation
  const templateCounts = entries.reduce((acc, entry) => {
    acc[entry.templateType] = (acc[entry.templateType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // 7-day mood trail
  const past7Days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const iso = d.toISOString().split('T')[0];
    const log = moodLogs.find((l) => l.date === iso);
    const entryForDay = entries.find((e) => new Date(e.createdAt).toISOString().split('T')[0] === iso);
    const moodKey = log ? log.mood : entryForDay ? entryForDay.mood : null;
    return {
      date: iso,
      dayName: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()],
      mood: moodKey,
    };
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8DFC8] pb-5">
        <div>
          <h2 className="font-display text-3xl font-semibold text-[#2B231F]">
            Insights & Reflection
          </h2>
          <p className="text-xs text-[#7C7067] font-serif mt-1">
            Observe your emotional rhythms and capture your answers to gentle inquiries.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Segmented View Switcher */}
          <div className="bg-[#EFE8D8] p-1 rounded-2xl flex items-center space-x-1 border border-[#E2D6C1]">
            <button
              onClick={() => handleTabSwitch('mirror')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                activeTab === 'mirror'
                  ? 'bg-[#FFFDF9] text-[#2B231F] shadow-xs'
                  : 'text-[#7C7067] hover:text-[#2B231F]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#C97C4C]" />
              <span>Current Mirror</span>
            </button>

            <button
              onClick={() => handleTabSwitch('history')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                activeTab === 'history'
                  ? 'bg-[#FFFDF9] text-[#2B231F] shadow-xs'
                  : 'text-[#7C7067] hover:text-[#2B231F]'
              }`}
            >
              <History className="w-3.5 h-3.5 text-[#C97C4C]" />
              <span>Reflection History</span>
              {weeklyReflections.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-[#FAF0E8] border border-[#EAD6C7] text-[#8C5230] text-[10px] font-bold">
                  {weeklyReflections.length}
                </span>
              )}
            </button>

            <button
              id="tab-dialogues-btn"
              onClick={() => handleTabSwitch('dialogues')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                activeTab === 'dialogues'
                  ? 'bg-[#FFFDF9] text-[#2B231F] shadow-xs'
                  : 'text-[#7C7067] hover:text-[#2B231F]'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-[#C97C4C]" />
              <span>Saved Dialogues</span>
              {reflectionChatSessions.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-[#FAF0E8] border border-[#EAD6C7] text-[#8C5230] text-[10px] font-bold">
                  {reflectionChatSessions.length}
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center space-x-2">
            {/* Pop-up Chatbot Trigger */}
            <button
              id="open-ai-chat-header-btn"
              onClick={() => setShowChatModal(true)}
              className="px-3.5 py-2 rounded-xl bg-[#FAF0E8] hover:bg-[#F3E2D3] border border-[#EAD6C7] text-[#8C5230] font-semibold text-xs shadow-2xs transition-all flex items-center space-x-1.5 active:scale-95"
              title="Open AI Reflection Companion Pop-up"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#C97C4C]" />
              <span className="hidden sm:inline">Chat with AI Mirror</span>
              <span className="sm:hidden">AI Chat</span>
            </button>

            {activeTab === 'mirror' && (
              <button
                id="generate-weekly-btn"
                onClick={onGenerateWeeklyReflection}
                disabled={isGeneratingReflection || entries.length === 0}
                className="px-4 py-2 rounded-xl bg-[#C97C4C] hover:bg-[#B46A3B] text-[#FFFDF9] font-medium text-xs shadow-xs transition-all flex items-center space-x-1.5 disabled:opacity-50 active:scale-[0.98]"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingReflection ? 'animate-spin' : ''}`} />
                <span>{isGeneratingReflection ? 'Synthesizing...' : 'Refresh'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Success Notification Banner */}
      {saveSuccessMsg && (
        <div className="p-3.5 rounded-2xl bg-[#FAF0E8] border border-[#EAD6C7] text-[#8C5230] text-xs font-medium flex items-center justify-between animate-fade-in shadow-xs">
          <div className="flex items-center space-x-2">
            <BookmarkCheck className="w-4 h-4 text-[#C97C4C]" />
            <span>{saveSuccessMsg}</span>
          </div>
          <button
            onClick={() => handleTabSwitch('history')}
            className="text-[11px] underline font-semibold text-[#8C5230] hover:text-[#C97C4C]"
          >
            View History Archive →
          </button>
        </div>
      )}

      {/* TAB 1: CURRENT MIRROR */}
      {activeTab === 'mirror' && (
        <div className="space-y-8">
          {/* The Weekly Reflection Card */}
          <section className="bg-[#FFFDF9] border border-[#E0D3BC] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#EFE7D8]">
              <div className="flex items-center space-x-2.5 text-[#C97C4C]">
                <div className="w-8 h-8 rounded-xl bg-[#FAF0E8] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-[#C97C4C]" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold tracking-wider uppercase text-[#C97C4C]">
                      Weekly Reflection Mirror
                    </span>
                    {latestReflection && (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#FAF0E8] text-[#8C5230] border border-[#EAD6C7]">
                        Active Week
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#8C8075]">
                    {latestReflection
                      ? `${latestReflection.weekStartDate} — ${latestReflection.weekEndDate}`
                      : 'A quiet synthesis of your recent notebook pages'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {latestReflection && (
                  <>
                    <button
                      id="open-mirror-popup-btn"
                      onClick={() => {
                        setWeeklyModalReflection(latestReflection);
                        setShowWeeklyModal(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#FAF6EE] hover:bg-[#EFE5D3] border border-[#E0D3BC] text-[#594C44] text-xs font-semibold transition-all flex items-center space-x-1.5 shadow-2xs active:scale-95"
                      title="Open this Weekly Reflection as a Pop-up"
                    >
                      <Maximize2 className="w-3.5 h-3.5 text-[#C97C4C]" />
                      <span>View as Pop-up</span>
                    </button>

                    <button
                      id="open-chat-from-mirror-btn"
                      onClick={() => setShowChatModal(true)}
                      className="px-3 py-1.5 rounded-xl bg-[#FAF0E8] hover:bg-[#F0DECE] border border-[#EAD6C7] text-[#8C5230] text-xs font-semibold transition-all flex items-center space-x-1.5 shadow-2xs active:scale-95"
                      title="Open AI Chatbot pop-up for this reflection"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-[#C97C4C]" />
                      <span>Chat with Mirror</span>
                    </button>
                  </>
                )}

                <span className="text-[10px] text-[#8C8075] bg-[#FAF6EE] px-2.5 py-1 rounded-full border border-[#EAE0CD] self-start sm:self-auto hidden lg:inline">
                  Safe & isolated
                </span>
              </div>
            </div>

            {latestReflection ? (
              <div className="space-y-6">
                {/* Emotional Curve Summary */}
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8C8075]">
                    Emotional Curve
                  </span>
                  <p className="font-serif text-base sm:text-lg text-[#2B231F] leading-relaxed italic bg-[#FAF6EE] p-5 rounded-2xl border border-[#EAE1CF]">
                    "{latestReflection.moodTrendSummary}"
                  </p>
                </div>

                {/* Recurring Themes */}
                <div className="space-y-2.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8C8075]">
                    Recurring Themes
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {latestReflection.themes.map((theme, idx) => (
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

                {/* Interactive Gentle Reflection Questions */}
                <div className="space-y-4 pt-2 border-t border-[#EFE7D8]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8C8075] flex items-center space-x-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-[#C97C4C]" />
                        <span>Gentle Inquiries to Ponder</span>
                      </span>
                      <p className="text-[11px] text-[#7C7067] font-serif mt-0.5">
                        Type your thoughts or answers below. They will be preserved in your reflection history.
                      </p>
                    </div>

                    <button
                      onClick={handleSaveCurrentInquiryAnswers}
                      disabled={isSavingAnswers}
                      className="px-4 py-2 rounded-xl bg-[#C97C4C] hover:bg-[#B46A3B] text-[#FFFDF9] font-medium text-xs shadow-xs transition-all flex items-center space-x-1.5 self-start sm:self-auto disabled:opacity-50 active:scale-[0.98]"
                    >
                      <BookmarkCheck className="w-3.5 h-3.5" />
                      <span>{isSavingAnswers ? 'Saving Thoughts...' : 'Save Thoughts to History'}</span>
                    </button>
                  </div>

                  {/* AI Companion Interactive Dialogue Banner */}
                  <div className="p-4 rounded-2xl bg-[#FAF0E8]/80 border border-[#EAD6C7] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-xl bg-[#FFFDF9] border border-[#EAD6C7] flex items-center justify-center text-[#C97C4C] shadow-2xs shrink-0">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#2B231F]">
                          Prefer an interactive conversational dialogue?
                        </h4>
                        <p className="text-[11px] text-[#7C7067] font-serif">
                          Discuss these inquiries with the AI companion in a focused pop-up window. Completed chats are permanently archived in your Saved Dialogues.
                        </p>
                      </div>
                    </div>
                    <button
                      id="launch-chat-modal-banner-btn"
                      onClick={() => setShowChatModal(true)}
                      className="px-3.5 py-2 rounded-xl bg-[#C97C4C] hover:bg-[#B46A3B] text-white text-xs font-semibold shadow-xs transition-all flex items-center space-x-1.5 self-start sm:self-auto shrink-0 active:scale-95"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Chat in Pop-up</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {latestReflection.reflectionQuestions.map((question, idx) => {
                      const qKey = `q_${idx}`;
                      const currentAnswer = inquiryAnswers[qKey] || '';
                      return (
                        <div
                          key={idx}
                          className="p-5 rounded-2xl bg-[#FFFDF9] border border-[#EAE1CF] space-y-3 focus-within:border-[#C97C4C] transition-colors shadow-2xs"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-0.5">
                              <span className="text-[10px] font-bold text-[#C97C4C] uppercase tracking-wider">
                                Inquiry #{idx + 1}
                              </span>
                              <p className="font-serif text-sm sm:text-base text-[#2B231F] font-medium italic">
                                "{question}"
                              </p>
                            </div>
                            {currentAnswer && (
                              <span className="text-[10px] text-[#8C5230] font-semibold flex items-center space-x-1 bg-[#FAF0E8] border border-[#EAD6C7] px-2.5 py-0.5 rounded-full shrink-0">
                                <Check className="w-3 h-3 text-[#C97C4C]" />
                                <span>Answered</span>
                              </span>
                            )}
                          </div>

                          {/* Response Text Area */}
                          <div className="space-y-1.5">
                            <textarea
                              rows={3}
                              placeholder="Share your thoughts, feelings, or answer to this inquiry..."
                              value={currentAnswer}
                              onChange={(e) =>
                                setInquiryAnswers((prev) => ({
                                  ...prev,
                                  [qKey]: e.target.value,
                                }))
                              }
                              className="w-full text-xs sm:text-sm font-serif p-3 bg-[#FAF6EE] border border-[#DDD0BC] rounded-xl focus:outline-hidden focus:ring-1 focus:ring-[#C97C4C] text-[#2B231F] leading-relaxed resize-y placeholder:text-[#9E9187]"
                            />
                            <div className="flex items-center justify-between text-[10px] text-[#9E9187] px-1">
                              <span>Saved locally & synced to your private history</span>
                              <span>{currentAnswer.length} characters</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* General Reflection Notes */}
                  <div className="p-5 rounded-2xl bg-[#FAF6EE] border border-[#EAE1CF] space-y-2">
                    <span className="text-[11px] font-semibold text-[#594C44] uppercase tracking-wider">
                      Additional Personal Notes for This Week (Optional)
                    </span>
                    <textarea
                      rows={2}
                      placeholder="Any concluding thoughts, commitments, or reminders for your next week..."
                      value={userGeneralNotes}
                      onChange={(e) => setUserGeneralNotes(e.target.value)}
                      className="w-full text-xs font-serif p-3 bg-[#FFFDF9] border border-[#DDD0BC] rounded-xl focus:outline-hidden focus:ring-1 focus:ring-[#C97C4C] text-[#2B231F] leading-relaxed resize-y placeholder:text-[#9E9187]"
                    />
                  </div>

                  {/* Bottom Save Action */}
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={handleSaveCurrentInquiryAnswers}
                      disabled={isSavingAnswers}
                      className="px-5 py-2.5 rounded-xl bg-[#C97C4C] hover:bg-[#B46A3B] text-[#FFFDF9] font-medium text-xs shadow-xs transition-all flex items-center space-x-1.5 disabled:opacity-50 active:scale-[0.98]"
                    >
                      <BookmarkCheck className="w-4 h-4" />
                      <span>{isSavingAnswers ? 'Saving Thoughts...' : 'Save All Reflection Thoughts'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 space-y-3">
                <Sparkles className="w-8 h-8 text-[#C97C4C] mx-auto opacity-70" />
                <h4 className="font-display font-semibold text-lg text-[#2B231F]">
                  Your Weekly Mirror is Ready to Unfold
                </h4>
                <p className="text-xs text-[#7C7067] font-serif max-w-md mx-auto">
                  Write a few notebook entries, then tap the refresh button above to generate a gentle synthesis of your emotional rhythm and open inquiries.
                </p>
              </div>
            )}
          </section>

          {/* Mood Flow & Distribution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 7-Day Mood Trend */}
            <div className="bg-[#FFFDF9] border border-[#E8DFC8] rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-semibold text-base text-[#2B231F]">
                  7-Day Mood Flow
                </h3>
                <span className="text-xs text-[#8C8075]">
                  {streakCount} {streakCount === 1 ? 'day' : 'days'} streak
                </span>
              </div>

              <div className="grid grid-cols-7 gap-2 pt-2 text-center">
                {past7Days.map((d, idx) => {
                  const meta = d.mood ? MOODS[d.mood] : null;
                  return (
                    <div key={idx} className="flex flex-col items-center space-y-1.5">
                      <div
                        className={`w-9 h-9 rounded-2xl flex items-center justify-center text-sm transition-transform ${
                          meta ? 'shadow-xs hover:scale-105' : 'bg-[#EFE8D8] text-transparent'
                        }`}
                        style={{
                          backgroundColor: meta ? meta.bgLight : undefined,
                          borderColor: meta ? meta.borderLight : undefined,
                        }}
                      >
                        <span>{meta ? meta.emoji : '·'}</span>
                      </div>
                      <span className="text-[10px] font-medium text-[#8C8075]">{d.dayName}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mood Distribution */}
            <div className="bg-[#FFFDF9] border border-[#E8DFC8] rounded-3xl p-6 shadow-xs space-y-4">
              <h3 className="font-display font-semibold text-base text-[#2B231F]">
                Mood Breakdown
              </h3>

              <div className="space-y-2.5">
                {(Object.keys(MOODS) as MoodType[]).map((mKey) => {
                  const meta = MOODS[mKey];
                  const count = moodCounts[mKey] || 0;
                  const pct = entries.length > 0 ? Math.round((count / entries.length) * 100) : 0;
                  return (
                    <div key={mKey} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center space-x-1.5 font-medium text-[#2B231F]">
                          <span>{meta.emoji}</span>
                          <span>{meta.label}</span>
                        </span>
                        <span className="text-[#8C8075]">{count} ({pct}%)</span>
                      </div>
                      <div className="h-1.5 w-full bg-[#EFE8D8] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: meta.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Template Habits */}
          <div className="bg-[#FFFDF9] border border-[#E8DFC8] rounded-3xl p-6 shadow-xs space-y-4">
            <h3 className="font-display font-semibold text-base text-[#2B231F]">
              Journaling Template Habits
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {JOURNAL_TEMPLATES.map((tmpl) => {
                const count = templateCounts[tmpl.id] || 0;
                return (
                  <div
                    key={tmpl.id}
                    className="p-3.5 rounded-2xl bg-[#FAF6EE] border border-[#EAE1CF] text-center space-y-1"
                  >
                    <div className="text-lg font-display font-bold text-[#2B231F]">{count}</div>
                    <div className="text-xs font-semibold text-[#665950] truncate">{tmpl.title}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SEPARATE REFLECTION HISTORY ARCHIVE */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-2">
            <div>
              <h3 className="font-display text-xl font-semibold text-[#2B231F]">
                Reflection History Archive
              </h3>
              <p className="text-xs text-[#7C7067] font-serif">
                Chronological record of your past weekly reflection mirrors and your answers to gentle inquiries.
              </p>
            </div>
            <span className="text-xs font-semibold text-[#8C5230] bg-[#FAF0E8] border border-[#EAD6C7] px-3 py-1 rounded-full">
              {weeklyReflections.length} {weeklyReflections.length === 1 ? 'Reflection Saved' : 'Reflections Saved'}
            </span>
          </div>

          {weeklyReflections.length === 0 ? (
            <div className="bg-[#FFFDF9] border border-[#E8DFC8] rounded-3xl p-12 text-center space-y-3">
              <History className="w-8 h-8 text-[#7C7067] mx-auto opacity-60" />
              <h4 className="font-display font-semibold text-base text-[#2B231F]">
                No Reflection History Yet
              </h4>
              <p className="text-xs text-[#7C7067] font-serif max-w-sm mx-auto">
                Generate your first weekly reflection mirror in the "Current Mirror" tab and record your thoughts on the inquiries to build your history.
              </p>
              <button
                onClick={() => handleTabSwitch('mirror')}
                className="mt-2 px-4 py-2 rounded-xl bg-[#C97C4C] hover:bg-[#B46A3B] text-[#FFFDF9] text-xs font-semibold shadow-xs"
              >
                Go to Current Mirror
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {weeklyReflections.map((ref) => {
                const isExpanded = expandedReflectionId === ref.id;
                const isEditing = editingHistoryId === ref.id;
                const isConfirmingDelete = deleteConfirmId === ref.id;
                const answersMap = isEditing ? historyInquiryAnswers : (ref.inquiryAnswers || {});
                const hasAnyAnswers = Object.values(ref.inquiryAnswers || {}).some((a) => a.trim().length > 0);

                return (
                  <div
                    key={ref.id}
                    className="bg-[#FFFDF9] border border-[#E0D3BC] rounded-3xl overflow-hidden shadow-xs transition-all"
                  >
                    {/* Reflection Card Header */}
                    <div
                      onClick={() => setExpandedReflectionId(isExpanded ? null : ref.id)}
                      className="p-5 sm:p-6 cursor-pointer hover:bg-[#FAF6EE]/70 transition-colors flex items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-display font-semibold text-base sm:text-lg text-[#2B231F]">
                            Week of {ref.weekStartDate} to {ref.weekEndDate}
                          </span>
                          <span className="text-[10px] font-semibold text-[#8C5230] bg-[#FAF0E8] border border-[#EAD6C7] px-2.5 py-0.5 rounded-full">
                            {ref.entriesCount || 0} entries synthesized
                          </span>
                          {hasAnyAnswers && (
                            <span className="text-[10px] font-semibold text-[#8C5230] bg-[#FAF0E8] border border-[#EAD6C7] px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                              <Check className="w-3 h-3 text-[#C97C4C]" />
                              <span>Inquiries Answered</span>
                            </span>
                          )}
                        </div>

                        <p className="font-serif text-xs text-[#665950] italic line-clamp-1">
                          "{ref.moodTrendSummary}"
                        </p>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setWeeklyModalReflection(ref);
                            setShowWeeklyModal(true);
                          }}
                          className="px-2.5 py-1 rounded-xl bg-[#FAF6EE] hover:bg-[#EFE5D3] border border-[#E0D3BC] text-[#594C44] text-xs font-semibold transition-all flex items-center space-x-1 shadow-2xs"
                          title="Open this reflection as a pop-up"
                        >
                          <Maximize2 className="w-3 h-3 text-[#C97C4C]" />
                          <span>Pop-up</span>
                        </button>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-[#8C8075]" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-[#8C8075]" />
                        )}
                      </div>
                    </div>

                    {/* Expanded Detail Body */}
                    {isExpanded && (
                      <div className="px-5 sm:px-6 pb-6 pt-2 border-t border-[#EFE7D8] space-y-5 animate-fade-in">
                        {/* Emotional Curve */}
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold text-[#8C8075] uppercase tracking-wider">
                            Emotional Curve
                          </span>
                          <p className="font-serif text-sm text-[#2B231F] leading-relaxed italic bg-[#FAF6EE] p-4 rounded-xl border border-[#EAE1CF]">
                            "{ref.moodTrendSummary}"
                          </p>
                        </div>

                        {/* Themes */}
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold text-[#8C8075] uppercase tracking-wider">
                            Recurring Themes
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {ref.themes.map((t, i) => (
                              <span
                                key={i}
                                className="px-3 py-1 rounded-lg bg-[#FAF0E8] border border-[#EAD6C7] text-xs text-[#8C5230] font-medium"
                              >
                                • {t}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Inquiries & Recorded Thoughts */}
                        <div className="space-y-3 pt-2 border-t border-[#EFE7D8]">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-[#8C8075] uppercase tracking-wider flex items-center space-x-1.5">
                              <MessageSquare className="w-3.5 h-3.5 text-[#C97C4C]" />
                              <span>Gentle Inquiries & Your Recorded Thoughts</span>
                            </span>

                            {!isEditing && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingHistoryId(ref.id);
                                  setHistoryInquiryAnswers(ref.inquiryAnswers || {});
                                }}
                                className="text-xs font-semibold text-[#C97C4C] hover:underline flex items-center space-x-1"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>{hasAnyAnswers ? 'Edit Thoughts' : 'Add Thoughts'}</span>
                              </button>
                            )}
                          </div>

                          <div className="space-y-3">
                            {ref.reflectionQuestions.map((q, idx) => {
                              const qKey = `q_${idx}`;
                              const ans = answersMap[qKey] || '';

                              return (
                                <div
                                  key={idx}
                                  className="p-4 rounded-2xl bg-[#FAF6EE] border border-[#EAE1CF] space-y-2"
                                >
                                  <div className="text-[10px] font-bold text-[#C97C4C]">
                                    Question #{idx + 1}
                                  </div>
                                  <p className="font-serif text-xs sm:text-sm text-[#4A3F39] italic font-medium">
                                    "{q}"
                                  </p>

                                  {isEditing ? (
                                    <textarea
                                      rows={2}
                                      value={ans}
                                      onChange={(e) =>
                                        setHistoryInquiryAnswers((prev) => ({
                                          ...prev,
                                          [qKey]: e.target.value,
                                        }))
                                      }
                                      placeholder="Write your reflection response..."
                                      className="w-full text-xs font-serif p-2.5 bg-[#FFFDF9] border border-[#DDD0BC] rounded-xl focus:outline-hidden focus:ring-1 focus:ring-[#C97C4C] text-[#2B231F]"
                                    />
                                  ) : (
                                    <div className="pt-1">
                                      {ans ? (
                                        <div className="p-3 bg-[#FFFDF9] rounded-xl border border-[#E2D6C1] text-xs font-serif text-[#2B231F] whitespace-pre-wrap leading-relaxed">
                                          {ans}
                                        </div>
                                      ) : (
                                        <p className="text-[11px] text-[#8C8075] italic">
                                          No response recorded for this question yet.
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* Editing Action buttons in history card */}
                          {isEditing && (
                            <div className="flex items-center justify-end space-x-2 pt-2">
                              <button
                                onClick={() => setEditingHistoryId(null)}
                                className="px-3 py-1.5 rounded-xl text-xs text-[#7C7067] hover:bg-[#EFE8D8]"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleSaveHistoryInquiryAnswers(ref)}
                                disabled={isSavingAnswers}
                                className="px-4 py-1.5 rounded-xl bg-[#C97C4C] hover:bg-[#B46A3B] text-[#FFFDF9] text-xs font-semibold shadow-xs"
                              >
                                {isSavingAnswers ? 'Saving...' : 'Save Updated Thoughts'}
                              </button>
                            </div>
                          )}

                          {ref.userNotes && !isEditing && (
                            <div className="p-3 bg-[#FAF0E8] rounded-xl border border-[#EAD6C7] text-xs font-serif text-[#8C5230]">
                              <span className="font-bold text-[10px] uppercase block">Personal Notes:</span>
                              {ref.userNotes}
                            </div>
                          )}
                        </div>

                        {/* Footer info & delete action */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] text-[#8C8075] pt-3 border-t border-[#EFE7D8]">
                          <span>
                            Generated on {new Date(ref.createdAt).toLocaleDateString()}
                            {ref.savedAt && ` · Thoughts saved ${new Date(ref.savedAt).toLocaleDateString()}`}
                          </span>

                          {onDeleteWeeklyReflection && (
                            <div>
                              {isConfirmingDelete ? (
                                <div className="flex items-center space-x-2 bg-[#FEE2E2] p-1.5 px-3 rounded-xl border border-[#FECACA]">
                                  <span className="text-xs text-[#991B1B] font-medium">Delete this reflection record?</span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDeleteWeeklyReflection(ref.id);
                                      setDeleteConfirmId(null);
                                    }}
                                    className="px-2 py-0.5 rounded-md bg-[#DC2626] hover:bg-[#B91C1C] text-white text-[11px] font-semibold transition-colors"
                                  >
                                    Yes, Delete
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeleteConfirmId(null);
                                    }}
                                    className="px-2 py-0.5 rounded-md bg-white border border-[#E5E7EB] text-[#4B5563] text-[11px] font-medium hover:bg-[#F3F4F6]"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteConfirmId(ref.id);
                                  }}
                                  className="text-[#B91C1C] hover:text-[#991B1B] hover:underline flex items-center space-x-1 font-medium transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Delete Record</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SEPARATE SAVED REFLECTION DIALOGUES SECTION */}
      {activeTab === 'dialogues' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
            <div>
              <h3 className="font-display text-xl font-semibold text-[#2B231F]">
                Saved Reflection Dialogues
              </h3>
              <p className="text-xs text-[#7C7067] font-serif">
                Completed conversations with your AI companion exploring weekly reflection inquiries.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-[#8C5230] bg-[#FAF0E8] border border-[#EAD6C7] px-3 py-1 rounded-full">
                {reflectionChatSessions.length} {reflectionChatSessions.length === 1 ? 'Dialogue Saved' : 'Dialogues Saved'}
              </span>
              <button
                id="new-dialogue-btn"
                onClick={() => setShowChatModal(true)}
                className="px-3.5 py-1.5 rounded-xl bg-[#C97C4C] hover:bg-[#B46A3B] text-white text-xs font-semibold shadow-xs transition-all flex items-center space-x-1.5 active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Dialogue</span>
              </button>
            </div>
          </div>

          {reflectionChatSessions.length === 0 ? (
            <div className="bg-[#FFFDF9] border border-[#E8DFC8] rounded-3xl p-12 text-center space-y-4 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-[#FAF0E8] border border-[#EAD6C7] flex items-center justify-center text-[#C97C4C] mx-auto shadow-2xs">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-display font-semibold text-base sm:text-lg text-[#2B231F]">
                  No Saved Dialogues Yet
                </h4>
                <p className="text-xs text-[#7C7067] font-serif max-w-md mx-auto leading-relaxed">
                  When you converse with the AI Companion in the pop-up and click "Complete & Save Dialogue", your conversation will be stored in this separate archive so you can re-read it anytime.
                </p>
              </div>
              <button
                onClick={() => setShowChatModal(true)}
                className="mt-2 px-5 py-2.5 rounded-xl bg-[#C97C4C] hover:bg-[#B46A3B] text-white text-xs font-semibold shadow-xs transition-all inline-flex items-center space-x-2 active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                <span>Start Reflection Dialogue (Pop-up)</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reflectionChatSessions.map((session) => {
                const lastMessage = session.messages[session.messages.length - 1];

                return (
                  <div
                    key={session.id}
                    className="bg-[#FFFDF9] border border-[#E0D3BC] rounded-3xl p-5 sm:p-6 space-y-4 shadow-xs hover:border-[#C97C4C]/60 transition-all flex flex-col justify-between group"
                  >
                    <div className="space-y-3">
                      {/* Top Meta */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-7 h-7 rounded-lg bg-[#FAF0E8] border border-[#EAD6C7] flex items-center justify-center text-[#C97C4C]">
                            <MessageSquare className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-xs font-semibold text-[#2B231F] flex items-center space-x-1">
                            <Calendar className="w-3 h-3 text-[#8C8075]" />
                            <span>{new Date(session.completedAt || session.createdAt).toLocaleDateString()}</span>
                          </span>
                        </div>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#FAF0E8] text-[#8C5230] border border-[#EAD6C7]">
                          {session.messages.length} messages
                        </span>
                      </div>

                      {/* Inquiry Explored */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-[#8C8075] uppercase tracking-wider flex items-center space-x-1">
                          <HelpCircle className="w-3 h-3 text-[#C97C4C]" />
                          <span>Inquiry Explored</span>
                        </span>
                        <p className="font-serif text-sm text-[#2B231F] italic font-medium line-clamp-2">
                          "{session.firstQuestion}"
                        </p>
                      </div>

                      {/* Excerpt / Last response */}
                      {lastMessage && (
                        <div className="p-3 rounded-xl bg-[#FAF6EE] border border-[#EAE1CF] text-xs font-serif text-[#665950] line-clamp-2 italic">
                          <span className="font-semibold text-[#8C5230] not-italic mr-1">
                            {lastMessage.sender === 'user' ? 'You:' : 'Companion:'}
                          </span>
                          {lastMessage.text}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="pt-3 border-t border-[#EFE7D8] flex items-center justify-between">
                      <button
                        onClick={() => setSelectedDialogueSession(session)}
                        className="px-3.5 py-1.5 rounded-xl bg-[#FAF0E8] hover:bg-[#F2E0CF] text-[#8C5230] border border-[#EAD6C7] text-xs font-semibold transition-all flex items-center space-x-1.5 shadow-2xs"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-[#C97C4C]" />
                        <span>Read Full Dialogue</span>
                      </button>

                      {onDeleteChatSession && (
                        <button
                          onClick={async () => {
                            if (window.confirm('Delete this saved conversation?')) {
                              await onDeleteChatSession(session.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-[#9E9187] hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete saved conversation"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Pop-up Modal 1: AI Chatbot Experience */}
      <ReflectionChatModal
        isOpen={showChatModal}
        onClose={() => setShowChatModal(false)}
        weeklyReflection={latestReflection}
        onSaveSession={async (session) => {
          if (onSaveChatSession) {
            await onSaveChatSession(session);
          }
        }}
        userId={userId || ''}
      />

      {/* Pop-up Modal 2: Weekly Reflection Pop-up Experience */}
      <WeeklyReflectionModal
        isOpen={showWeeklyModal}
        onClose={() => {
          setShowWeeklyModal(false);
          setWeeklyModalReflection(null);
        }}
        reflection={weeklyModalReflection || latestReflection}
        onSaveAnswers={async (updated) => {
          await onSaveWeeklyReflection(updated);
        }}
        onOpenChatModal={() => {
          setShowChatModal(true);
        }}
      />

      {/* Pop-up Modal 3: View Details of Saved Dialogue */}
      <SavedDialogueDetailModal
        session={selectedDialogueSession}
        onClose={() => setSelectedDialogueSession(null)}
        onDelete={onDeleteChatSession}
      />
    </div>
  );
};

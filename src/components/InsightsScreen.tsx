import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, 
  BookOpen, 
  Flame, 
  Calendar, 
  Clock, 
  TrendingUp, 
  Smile, 
  BarChart2, 
  ArrowRight, 
  PenTool,
  Compass,
  RefreshCw,
  Heart,
  HelpCircle,
  Eye,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  MessageCircle
} from 'lucide-react';
import type { JournalEntry, MoodLog, MoodType, EmotionalMirrorAnalysis } from '../types';
import { MOODS, JOURNAL_TEMPLATES } from '../data/templates';
import { MoodIcon } from './MoodIcon';
import { WeeklyInquiryChatModal, type InquiryNote } from './WeeklyInquiryChatModal';

interface WeekWindow {
  key: string;
  label: string;
  shortLabel: string;
  startDate: Date;
  endDate: Date;
  isCurrent: boolean;
}

interface SavedWeeklyReflection {
  moodTrendSummary: string;
  themes: string[];
  reflectionQuestions: string[];
  disclaimer?: string;
  userNote?: string;
  inquiryNotes?: InquiryNote[];
  generatedAt: number;
}

interface InsightsScreenProps {
  entries: JournalEntry[];
  moodLogs: MoodLog[];
  streakCount: number;
  onViewEntry?: (entry: JournalEntry) => void;
  userId?: string;
  onWriteNewEntry?: () => void;
}

// Generate the past 8 calendar weeks (Monday through Sunday)
function generatePastWeeks(): WeekWindow[] {
  const weeks: WeekWindow[] = [];
  const now = new Date();

  // Get current Monday (start of current week)
  const day = now.getDay();
  const diffToMonday = (day === 0 ? -6 : 1) - day;
  const currentMonday = new Date(now);
  currentMonday.setDate(now.getDate() + diffToMonday);
  currentMonday.setHours(0, 0, 0, 0);

  for (let i = 0; i < 8; i++) {
    const start = new Date(currentMonday);
    start.setDate(start.getDate() - (i * 7));
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    const startFormatted = start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const endFormatted = end.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

    let label = '';
    let shortLabel = '';
    if (i === 0) {
      label = `This Week (${startFormatted} – ${endFormatted})`;
      shortLabel = `This Week`;
    } else if (i === 1) {
      label = `Last Week (${startFormatted} – ${endFormatted})`;
      shortLabel = `Last Week`;
    } else {
      label = `${i} Weeks Ago (${startFormatted} – ${endFormatted})`;
      shortLabel = `${i}w ago`;
    }

    weeks.push({
      key: `${start.toISOString().split('T')[0]}_${end.toISOString().split('T')[0]}`,
      label,
      shortLabel,
      startDate: start,
      endDate: end,
      isCurrent: i === 0,
    });
  }

  return weeks;
}

export const InsightsScreen: React.FC<InsightsScreenProps> = ({
  entries,
  moodLogs,
  streakCount,
  onViewEntry,
  userId,
  onWriteNewEntry,
}) => {
  const weeks = useMemo(() => generatePastWeeks(), []);

  // Default to the first week that contains entries, or weeks[0]
  const initialWeekKey = useMemo(() => {
    const weekWithEntries = weeks.find((w) =>
      entries.some((e) => {
        const d = new Date(e.createdAt);
        return d >= w.startDate && d <= w.endDate;
      })
    );
    return weekWithEntries ? weekWithEntries.key : weeks[0].key;
  }, [weeks, entries]);

  const [selectedWeekKey, setSelectedWeekKey] = useState<string>(initialWeekKey);
  const selectedWeek = weeks.find((w) => w.key === selectedWeekKey) || weeks[0];

  // State for Weekly Reflection of the selected week
  const [weeklyReflectionsCache, setWeeklyReflectionsCache] = useState<Record<string, SavedWeeklyReflection>>({});
  const [isGeneratingWeekly, setIsGeneratingWeekly] = useState(false);
  const [weeklyError, setWeeklyError] = useState<string | null>(null);
  const [userWeeklyNote, setUserWeeklyNote] = useState<string>('');
  const [isSavedUserNote, setIsSavedUserNote] = useState(false);
  const [showInquiryChatModal, setShowInquiryChatModal] = useState(false);

  // State for AI Emotional Mirror (all notebook entries in app)
  const [emotionalMirror, setEmotionalMirror] = useState<EmotionalMirrorAnalysis | null>(null);
  const [isLoadingMirror, setIsLoadingMirror] = useState(false);
  const [mirrorError, setMirrorError] = useState<string | null>(null);

  // Load cached weekly reflections & mirror analysis from localStorage
  useEffect(() => {
    try {
      const storageKey = `hearthnote_weekly_reflections_${userId || 'guest'}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setWeeklyReflectionsCache(JSON.parse(saved));
      }

      const mirrorKey = `hearthnote_emotional_mirror_${userId || 'guest'}`;
      const savedMirror = localStorage.getItem(mirrorKey);
      if (savedMirror) {
        setEmotionalMirror(JSON.parse(savedMirror));
      }
    } catch (e) {
      console.warn('Could not read cached insights:', e);
    }
  }, [userId]);

  // Sync user note when switching selected week
  useEffect(() => {
    const currentRef = weeklyReflectionsCache[selectedWeekKey];
    setUserWeeklyNote(currentRef?.userNote || '');
    setIsSavedUserNote(false);
  }, [selectedWeekKey, weeklyReflectionsCache]);

  // Filter entries that were entered by the user in that particular week
  const weekEntries = entries.filter((e) => {
    const entryDate = new Date(e.createdAt);
    return entryDate >= selectedWeek.startDate && entryDate <= selectedWeek.endDate;
  });

  // Filter mood logs in that particular week
  const weekMoodLogs = moodLogs.filter((m) => {
    const mDate = new Date(m.createdAt);
    return mDate >= selectedWeek.startDate && mDate <= selectedWeek.endDate;
  });

  // Total words written across all entries
  const totalWords = entries.reduce((sum, e) => {
    const textWords = e.text ? e.text.trim().split(/\s+/).filter(Boolean).length : 0;
    const promptWords = e.promptAnswers 
      ? Object.values(e.promptAnswers).reduce((pSum, ans) => pSum + (ans ? ans.trim().split(/\s+/).filter(Boolean).length : 0), 0)
      : 0;
    return sum + (e.wordCount || (textWords + promptWords));
  }, 0);

  // Compute unique active calendar days
  const activeDaysSet = new Set<string>();
  entries.forEach((e) => {
    activeDaysSet.add(new Date(e.createdAt).toISOString().split('T')[0]);
  });
  moodLogs.forEach((m) => {
    activeDaysSet.add(new Date(m.createdAt).toISOString().split('T')[0]);
  });
  const totalActiveDays = activeDaysSet.size;

  // Compute 7-day mood flow
  const past7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const dayName = d.toLocaleDateString(undefined, { weekday: 'short' });
    const dayMonth = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

    const log = moodLogs.find((m) => m.date === dateStr);
    const dayEntries = entries.filter(
      (e) => new Date(e.createdAt).toISOString().split('T')[0] === dateStr
    );
    const mood: MoodType | null = log?.mood || (dayEntries.length > 0 ? dayEntries[0].mood : null);

    return {
      dateStr,
      dayName,
      dayMonth,
      mood,
      entriesCount: dayEntries.length,
    };
  });

  // Compute mood distribution across all entries and logs
  const moodDistribution: Record<MoodType, number> = (Object.keys(MOODS) as MoodType[]).reduce(
    (acc, m) => {
      acc[m] = 0;
      return acc;
    },
    {} as Record<MoodType, number>
  );

  entries.forEach((e) => {
    if (moodDistribution[e.mood] !== undefined) {
      moodDistribution[e.mood]++;
    }
  });
  moodLogs.forEach((m) => {
    if (moodDistribution[m.mood] !== undefined) {
      moodDistribution[m.mood]++;
    }
  });

  const totalMoodEvents = Object.values(moodDistribution).reduce((a, b) => a + b, 0);

  // Compute template usage distribution
  const templateUsage: Record<string, number> = {};
  entries.forEach((e) => {
    const title = e.templateTitle || 'Freeform Writing';
    templateUsage[title] = (templateUsage[title] || 0) + 1;
  });

  // Handle generating weekly reflection for the selected particular week
  const handleGenerateWeeklyReflection = async () => {
    if (weekEntries.length === 0) return;
    setIsGeneratingWeekly(true);
    setWeeklyError(null);

    try {
      const moodCounts = weekEntries.reduce((acc, entry) => {
        acc[entry.mood] = (acc[entry.mood] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const payloadEntries = weekEntries.map((e) => ({
        date: new Date(e.createdAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
        title: e.title || 'Untitled',
        templateTitle: e.templateTitle || e.templateType,
        mood: e.mood,
        text: e.text ? e.text.slice(0, 350) : '',
        promptAnswers: e.promptAnswers || {},
      }));

      const resp = await fetch('/api/gemini/weekly-reflection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entries: payloadEntries,
          moodCounts,
          weekRangeLabel: selectedWeek.label,
        }),
      });

      if (!resp.ok) {
        throw new Error('Could not generate weekly reflection. Please try again.');
      }

      const data = await resp.json();
      const reflectionData: SavedWeeklyReflection = {
        moodTrendSummary: data.moodTrendSummary || 'Your week held steady moments of quiet reflection and presence.',
        themes: Array.isArray(data.themes) && data.themes.length > 0 ? data.themes : ['Quiet presence', 'Daily rhythm'],
        reflectionQuestions: Array.isArray(data.reflectionQuestions) && data.reflectionQuestions.length > 0 ? data.reflectionQuestions : ['What small pause supported you most this week?'],
        disclaimer: data.disclaimer || 'AI-generated reflection · A quiet mirror, not advice.',
        userNote: weeklyReflectionsCache[selectedWeekKey]?.userNote || '',
        inquiryNotes: weeklyReflectionsCache[selectedWeekKey]?.inquiryNotes || [],
        generatedAt: Date.now(),
      };

      const updatedCache = {
        ...weeklyReflectionsCache,
        [selectedWeekKey]: reflectionData,
      };
      setWeeklyReflectionsCache(updatedCache);

      try {
        localStorage.setItem(
          `hearthnote_weekly_reflections_${userId || 'guest'}`,
          JSON.stringify(updatedCache)
        );
      } catch (err) {
        console.warn('LocalStorage save error:', err);
      }

      // Automatically trigger AI Companion chat bot popup asking the inquiries once after generating the weekly reflection!
      setShowInquiryChatModal(true);
    } catch (err: any) {
      console.error('Error generating weekly reflection:', err);
      setWeeklyError(err.message || 'Failed to synthesize weekly reflection.');
    } finally {
      setIsGeneratingWeekly(false);
    }
  };

  // Save personal user note for the weekly reflection
  const handleSaveUserWeeklyNote = () => {
    const currentRef = weeklyReflectionsCache[selectedWeekKey];
    if (!currentRef) return;

    const updated = {
      ...weeklyReflectionsCache,
      [selectedWeekKey]: {
        ...currentRef,
        userNote: userWeeklyNote,
      },
    };
    setWeeklyReflectionsCache(updated);
    setIsSavedUserNote(true);

    try {
      localStorage.setItem(
        `hearthnote_weekly_reflections_${userId || 'guest'}`,
        JSON.stringify(updated)
      );
    } catch (err) {
      console.warn('Failed to persist user note:', err);
    }

    setTimeout(() => setIsSavedUserNote(false), 2000);
  };

  // Store user answered inquiries as a note in the weekly reflection
  const handleSaveInquiryAnswers = (notes: InquiryNote[], formattedNoteText: string) => {
    const currentRef = weeklyReflectionsCache[selectedWeekKey];
    if (!currentRef) return;

    // Merge or update the note
    let mergedNote = currentRef.userNote || '';
    if (formattedNoteText) {
      if (!mergedNote.trim()) {
        mergedNote = formattedNoteText;
      } else if (!mergedNote.includes('Weekly Inquiries & Realizations')) {
        mergedNote = `${formattedNoteText}\n\n${mergedNote}`;
      } else {
        // If updating previous inquiries block, update to latest
        mergedNote = formattedNoteText;
      }
    }

    const updated: SavedWeeklyReflection = {
      ...currentRef,
      inquiryNotes: notes,
      userNote: mergedNote,
    };

    const updatedCache = {
      ...weeklyReflectionsCache,
      [selectedWeekKey]: updated,
    };
    setWeeklyReflectionsCache(updatedCache);
    setUserWeeklyNote(mergedNote);
    setIsSavedUserNote(true);

    try {
      localStorage.setItem(
        `hearthnote_weekly_reflections_${userId || 'guest'}`,
        JSON.stringify(updatedCache)
      );
    } catch (err) {
      console.warn('Failed to persist inquiry note:', err);
    }

    setTimeout(() => setIsSavedUserNote(false), 2500);
  };

  // Handle generating the AI Emotional Mirror across all notebook pages in the app
  const handleConsultEmotionalMirror = async () => {
    setIsLoadingMirror(true);
    setMirrorError(null);

    try {
      const payloadEntries = entries.map((e) => ({
        date: new Date(e.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }),
        title: e.title || 'Untitled',
        templateTitle: e.templateTitle || e.templateType,
        mood: e.mood,
        text: e.text ? e.text.slice(0, 400) : '',
        promptAnswers: e.promptAnswers || {},
      }));

      const resp = await fetch('/api/gemini/emotional-mirror', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entries: payloadEntries,
          moodCounts: moodDistribution,
        }),
      });

      if (!resp.ok) {
        throw new Error('Unable to consult emotional mirror. Please try again.');
      }

      const data: EmotionalMirrorAnalysis = await resp.json();
      const sanitizedMirror: EmotionalMirrorAnalysis = {
        primaryFeeling: data.primaryFeeling || 'Grounded Calm',
        primaryFeelingEmoji: data.primaryFeelingEmoji || '🌿',
        primaryFeelingSummary: data.primaryFeelingSummary || 'Your notebook reveals a steady undercurrent of thoughtful calm and patient presence.',
        feelingBreakdown: Array.isArray(data.feelingBreakdown) && data.feelingBreakdown.length > 0 ? data.feelingBreakdown : [
          { feeling: 'Grounded Calm', percentage: 50, insight: 'A consistent center of stillness.' },
          { feeling: 'Thoughtful Introspection', percentage: 30, insight: 'Careful examination of daily life.' },
          { feeling: 'Heartfelt Gratitude', percentage: 20, insight: 'Looking forward with quiet appreciation.' },
        ],
        recurringThemes: Array.isArray(data.recurringThemes) && data.recurringThemes.length > 0 ? data.recurringThemes : ['Quiet mindfulness', 'Self-compassion'],
        emotionalEvolution: data.emotionalEvolution || 'Your entries reflect a deepening trust in your own voice over time.',
        gentleEncouragement: data.gentleEncouragement || 'Holding space for your feelings with honesty is a true gift to your future self.',
        totalEntriesAnalyzed: typeof data.totalEntriesAnalyzed === 'number' ? data.totalEntriesAnalyzed : entries.length,
        lastAnalyzedAt: Date.now(),
      };
      setEmotionalMirror(sanitizedMirror);

      try {
        localStorage.setItem(
          `hearthnote_emotional_mirror_${userId || 'guest'}`,
          JSON.stringify(sanitizedMirror)
        );
      } catch (err) {
        console.warn('Failed to save mirror analysis to storage:', err);
      }
    } catch (err: any) {
      console.error('Error in emotional mirror:', err);
      setMirrorError(err.message || 'Failed to synthesize emotional mirror.');
    } finally {
      setIsLoadingMirror(false);
    }
  };

  const currentWeeklyReflection = weeklyReflectionsCache[selectedWeekKey];

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8 space-y-8 animate-fade-in pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8DFC8] pb-6">
        <div>
          <div className="flex items-center space-x-2 text-[#C97C4C] mb-1">
            <Sparkles className="w-5 h-5 text-[#C97C4C]" />
            <span className="text-xs font-bold tracking-wider uppercase">Emotional Synthesis</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#2B231F]">
            Insights & Mirrors
          </h2>
          <p className="text-xs sm:text-sm text-[#7C7067] font-serif mt-1">
            Gentle reflections on your weekly notebook pages and your overarching emotional landscape.
          </p>
        </div>
      </div>

      {/* Overview Stat Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#E8DFC8] shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[#C97C4C]">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8C8075]">Current Streak</span>
            <Flame className="w-4 h-4" />
          </div>
          <div className="font-display text-2xl sm:text-3xl font-bold text-[#2B231F]">
            {streakCount}
          </div>
          <div className="text-[10px] text-[#7C7067] font-serif">
            {streakCount === 1 ? 'consecutive day' : 'consecutive days'}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#E8DFC8] shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[#4D7C5F]">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8C8075]">Journal Entries</span>
            <BookOpen className="w-4 h-4" />
          </div>
          <div className="font-display text-2xl sm:text-3xl font-bold text-[#2B231F]">
            {entries.length}
          </div>
          <div className="text-[10px] text-[#7C7067] font-serif">
            {entries.length === 1 ? 'written entry' : 'written entries'}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#E8DFC8] shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[#3B82F6]">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8C8075]">Words Written</span>
            <PenTool className="w-4 h-4" />
          </div>
          <div className="font-display text-2xl sm:text-3xl font-bold text-[#2B231F]">
            {totalWords.toLocaleString()}
          </div>
          <div className="text-[10px] text-[#7C7067] font-serif">
            total words expressed
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#E8DFC8] shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[#8B5CF6]">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8C8075]">Active Days</span>
            <Calendar className="w-4 h-4" />
          </div>
          <div className="font-display text-2xl sm:text-3xl font-bold text-[#2B231F]">
            {totalActiveDays}
          </div>
          <div className="text-[10px] text-[#7C7067] font-serif">
            days visited & reflected
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: WEEKLY REFLECTION SECTION (Considers entries in that week)      */}
      {/* ========================================================================= */}
      <section 
        id="weekly-reflection-section" 
        className="bg-[#FFFDF9] border-2 border-[#E8DFC8] rounded-3xl p-5 sm:p-7 shadow-xs space-y-6"
      >
        {/* Section Title & Week Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#F0E7D6] pb-5">
          <div>
            <div className="flex items-center space-x-2 text-[#C97C4C]">
              <Calendar className="w-5 h-5 text-[#C97C4C]" />
              <h3 className="font-display text-xl font-semibold text-[#2B231F]">
                Weekly Reflection
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-[#7C7067] font-serif mt-1">
              Synthesizing the notebook pages entered in this particular week.
            </p>
          </div>

          {/* Week Selector Dropdown / Pills */}
          <div className="flex items-center space-x-2 self-start sm:self-auto">
            <span className="text-xs text-[#8C8075] font-medium hidden sm:inline">Select Week:</span>
            <div className="relative inline-block">
              <select
                id="weekly-reflection-week-select"
                value={selectedWeekKey}
                onChange={(e) => setSelectedWeekKey(e.target.value)}
                className="appearance-none bg-[#FAF6EE] border border-[#D9CEBA] text-[#2B231F] text-xs font-semibold rounded-xl pl-3 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-[#C97C4C]/40 cursor-pointer shadow-2xs"
              >
                {weeks.map((w) => {
                  // Count entries in this week
                  const count = entries.filter((e) => {
                    const d = new Date(e.createdAt);
                    return d >= w.startDate && d <= w.endDate;
                  }).length;

                  return (
                    <option key={w.key} value={w.key}>
                      {w.label} — {count} {count === 1 ? 'page' : 'pages'}
                    </option>
                  );
                })}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#8C8075] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Selected Week Info Strip */}
        <div className="p-3.5 rounded-2xl bg-[#FAF6EE] border border-[#EFE7D8] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-[#FFFDF9] border border-[#E8DFC8] flex items-center justify-center text-[#C97C4C]">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold text-[#2B231F] block text-xs sm:text-sm">
                {selectedWeek.label}
              </span>
              <span className="text-[11px] text-[#7C7067]">
                {weekEntries.length} {weekEntries.length === 1 ? 'notebook entry' : 'notebook entries'} entered in this particular week
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {weekEntries.length > 0 ? (
              <button
                id="generate-weekly-reflection-btn"
                onClick={handleGenerateWeeklyReflection}
                disabled={isGeneratingWeekly}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-[#C97C4C] hover:bg-[#B36838] text-white font-medium text-xs shadow-2xs transition-all disabled:opacity-50"
              >
                {isGeneratingWeekly ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing Week...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>
                      {currentWeeklyReflection ? 'Re-Synthesize Reflection' : 'Generate Weekly Reflection'}
                    </span>
                  </>
                )}
              </button>
            ) : (
              <span className="text-[11px] text-[#A89C8F] font-serif italic">
                No entries entered yet this week
              </span>
            )}
          </div>
        </div>

        {/* Error notice if weekly generation failed */}
        {weeklyError && (
          <div className="p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#991B1B]">
            {weeklyError}
          </div>
        )}

        {/* Journal Entries in this Particular Week (Cards) */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-[#8C8075] uppercase tracking-wider">
            Entries in This Week
          </h4>

          {weekEntries.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {weekEntries.map((entry) => {
                return (
                  <div
                    key={entry.id}
                    onClick={() => onViewEntry && onViewEntry(entry)}
                    className="p-3 rounded-2xl bg-[#FFFDF9] border border-[#E8DFC8] hover:border-[#C97C4C] transition-all flex items-start justify-between gap-3 cursor-pointer shadow-2xs hover:shadow-xs group"
                  >
                    <div className="flex items-start space-x-2.5 overflow-hidden">
                      <div className="w-7 h-7 rounded-xl flex items-center justify-center p-1 flex-shrink-0 shadow-2xs mt-0.5 bg-[#FFF8EE] border border-[#EAE1CF]">
                        <MoodIcon mood={entry.mood} className="w-full h-full" showGlow={false} />
                      </div>
                      <div className="overflow-hidden">
                        <div className="flex items-center space-x-1.5">
                          <h5 className="text-xs font-semibold text-[#2B231F] truncate group-hover:text-[#C97C4C] transition-colors">
                            {entry.title || entry.templateTitle}
                          </h5>
                        </div>
                        <p className="text-[11px] text-[#7C7067] font-serif line-clamp-1 mt-0.5">
                          {entry.text || 'Reflective entry'}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end text-[10px] text-[#8C8075] flex-shrink-0">
                      <span>{new Date(entry.createdAt).toLocaleDateString(undefined, { weekday: 'short', month: 'numeric', day: 'numeric' })}</span>
                      <span className="text-[#C97C4C] flex items-center mt-1">
                        View <ArrowRight className="w-2.5 h-2.5 ml-0.5" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-[#FAF6EE]/70 border border-dashed border-[#D9CEBA] text-center space-y-3">
              <p className="text-xs sm:text-sm text-[#7C7067] font-serif">
                You haven't added any notebook pages for {selectedWeek.shortLabel.toLowerCase()}.
              </p>
              {onWriteNewEntry && (
                <button
                  id="write-entry-for-week-btn"
                  onClick={onWriteNewEntry}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-[#FAF0E8] border border-[#C97C4C]/40 text-[#C97C4C] hover:bg-[#C97C4C] hover:text-white transition-all text-xs font-medium"
                >
                  <PenTool className="w-3 h-3" />
                  <span>Write a Page for This Week</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Loading weekly reflection state */}
        {isGeneratingWeekly && (
          <div className="p-8 rounded-2xl bg-[#FAF6EE] border border-[#E8DFC8] text-center space-y-3 animate-pulse">
            <RefreshCw className="w-6 h-6 text-[#C97C4C] animate-spin mx-auto" />
            <p className="text-sm font-display font-medium text-[#2B231F]">
              Reading and synthesizing your {weekEntries.length} notebook {weekEntries.length === 1 ? 'page' : 'pages'} for {selectedWeek.shortLabel}...
            </p>
            <p className="text-xs text-[#8C8075] font-serif">
              Looking at your mood trajectory, key themes, and thoughtful takeaways.
            </p>
          </div>
        )}

        {/* Generated Weekly Reflection Display */}
        {currentWeeklyReflection && !isGeneratingWeekly && (
          <div className="space-y-4 pt-2 border-t border-[#F0E7D6] animate-fade-in">
            {/* Trend Summary */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#F7F2E7] border border-[#E5DAC4] space-y-2.5">
              <div className="flex items-center space-x-2 text-[#C97C4C]">
                <Compass className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Weekly Emotional Rhythm
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#3E342F] font-serif leading-relaxed">
                {currentWeeklyReflection.moodTrendSummary}
              </p>
            </div>

            {/* Themes & Inquiries Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Themes */}
              <div className="p-4 rounded-2xl bg-[#FAF6EE] border border-[#EFE7D8] space-y-2">
                <div className="flex items-center space-x-1.5 text-[#4D7C5F]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <h5 className="text-xs font-bold uppercase tracking-wider">
                    Core Themes Noticed
                  </h5>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(currentWeeklyReflection.themes || []).map((theme, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-xl bg-[#FFFDF9] border border-[#E8DFC8] text-[11px] font-medium text-[#4A3F39] shadow-2xs"
                    >
                      🌱 {theme}
                    </span>
                  ))}
                </div>
              </div>

              {/* Talk Through This Week - Friendly Supportive Conversation */}
              <div className="p-4 rounded-2xl bg-[#FAF6EE] border border-[#EFE7D8] space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 text-[#3B82F6]">
                      <MessageCircle className="w-3.5 h-3.5" />
                      <h5 className="text-xs font-bold uppercase tracking-wider">
                        Talk Through This Week
                      </h5>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-[#EBF3ED] text-[#4D7C5F] text-[10px] font-semibold flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#4D7C5F] animate-pulse" />
                      <span>Friendly Reflection</span>
                    </span>
                  </div>
                  <p className="text-xs text-[#5A4D45] font-serif pt-1.5 leading-relaxed">
                    The AI has reflected on your week, and now you can talk about it. Explore what stood out, how you felt, and what your week might be telling you.
                  </p>
                </div>

                <div className="pt-1">
                  <button
                    id="open-inquiry-chat-btn"
                    onClick={() => setShowInquiryChatModal(true)}
                    className="w-full py-2 px-3 rounded-xl bg-[#FFFDF9] hover:bg-[#FAF0E8] border border-[#C97C4C]/40 text-[#C97C4C] text-xs font-semibold flex items-center justify-center space-x-1.5 shadow-2xs transition-all group cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#C97C4C] group-hover:rotate-12 transition-transform" />
                    <span>Talk Through This Week</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Answered Inquiries & Conversation Insights as Saved Notes */}
            {currentWeeklyReflection.inquiryNotes && currentWeeklyReflection.inquiryNotes.length > 0 && (
              <div className="p-4 sm:p-5 rounded-2xl bg-[#FFFDF9] border border-[#E8DFC8] space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-[#4D7C5F]">
                    <Sparkles className="w-3.5 h-3.5" />
                    <h5 className="text-xs font-bold uppercase tracking-wider">
                      Saved Conversation Realizations
                    </h5>
                  </div>
                  <button
                    onClick={() => setShowInquiryChatModal(true)}
                    className="text-[11px] text-[#C97C4C] hover:underline font-medium flex items-center space-x-1 cursor-pointer"
                  >
                    <MessageCircle className="w-3 h-3" />
                    <span>Continue Chat</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {currentWeeklyReflection.inquiryNotes.map((note, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-[#FAF6EE] border border-[#EFE7D8] space-y-1.5">
                      <p className="text-[11px] font-semibold text-[#7A6B63] flex items-center space-x-1.5">
                        <Lightbulb className="w-3 h-3 text-[#3B82F6]" />
                        <span>{note.question}</span>
                      </p>
                      <p className="text-xs text-[#2B231F] font-serif pl-4.5 border-l-2 border-[#C97C4C]">
                        {note.answer}
                      </p>
                      {note.companionReply && (
                        <p className="text-[11px] text-[#5A4D45] italic pl-4.5 pt-0.5">
                          Companion: "{note.companionReply}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Personal Weekly Note Box */}
            <div className="p-4 rounded-2xl bg-[#FAF6EE] border border-[#EFE7D8] space-y-2">
              <label 
                htmlFor="weekly-personal-note-input"
                className="text-xs font-semibold text-[#2B231F] flex items-center justify-between"
              >
                <span className="flex items-center space-x-1.5">
                  <PenTool className="w-3.5 h-3.5 text-[#C97C4C]" />
                  <span>My Personal Realization & Notes for This Week</span>
                </span>
                {isSavedUserNote && (
                  <span className="text-[11px] text-[#4D7C5F] font-medium flex items-center space-x-1 animate-fade-in">
                    <Check className="w-3 h-3" />
                    <span>Saved to your week</span>
                  </span>
                )}
              </label>
              <textarea
                id="weekly-personal-note-input"
                rows={3}
                value={userWeeklyNote}
                onChange={(e) => setUserWeeklyNote(e.target.value)}
                placeholder="What intention, realization, or feeling do you carry forward from this week?"
                className="w-full bg-[#FFFDF9] border border-[#E8DFC8] rounded-xl p-2.5 text-xs text-[#2B231F] placeholder:text-[#A89C8F] font-serif focus:outline-none focus:ring-1 focus:ring-[#C97C4C] resize-none leading-relaxed"
              />
              <div className="flex justify-end">
                <button
                  id="save-weekly-personal-note-btn"
                  onClick={handleSaveUserWeeklyNote}
                  disabled={!userWeeklyNote.trim()}
                  className="px-3 py-1 rounded-xl bg-[#FAF0E8] hover:bg-[#C97C4C] hover:text-white text-[#C97C4C] text-[11px] font-semibold border border-[#C97C4C]/30 transition-all disabled:opacity-40"
                >
                  Save Note
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Weekly Inquiry Chatbot Popup Modal */}
      {currentWeeklyReflection && (
        <WeeklyInquiryChatModal
          isOpen={showInquiryChatModal}
          onClose={() => setShowInquiryChatModal(false)}
          weekLabel={selectedWeek.label}
          questions={currentWeeklyReflection.reflectionQuestions || []}
          moodTrendSummary={currentWeeklyReflection.moodTrendSummary || ''}
          existingNotes={currentWeeklyReflection.inquiryNotes || []}
          onSaveInquiryAnswers={handleSaveInquiryAnswers}
        />
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: AI EMOTIONAL MIRROR (All notebook pages in the app)            */}
      {/* ========================================================================= */}
      <section 
        id="emotional-mirror-section"
        className="bg-[#FFFDF9] border-2 border-[#C97C4C]/40 rounded-3xl p-5 sm:p-7 shadow-xs space-y-6 relative overflow-hidden"
      >
        {/* Subtle decorative background accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-radial from-[#FAF0E8]/80 to-transparent pointer-events-none rounded-full blur-2xl -mr-16 -mt-16" />

        {/* Header with Consult Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#F0E7D6] pb-5 relative z-10">
          <div>
            <div className="flex items-center space-x-2 text-[#C97C4C]">
              <Eye className="w-5 h-5 text-[#C97C4C]" />
              <h3 className="font-display text-xl font-semibold text-[#2B231F]">
                AI Emotional Mirror
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-[#7C7067] font-serif mt-1">
              Analyzing all {entries.length} notebook {entries.length === 1 ? 'page' : 'pages'} in the app to discover what feeling you experience most.
            </p>
          </div>

          <button
            id="consult-emotional-mirror-btn"
            onClick={handleConsultEmotionalMirror}
            disabled={isLoadingMirror || entries.length === 0}
            className="flex items-center space-x-2 px-4 py-2 rounded-2xl bg-[#2B231F] hover:bg-[#433832] text-[#FAF6EE] font-medium text-xs shadow-2xs transition-all self-start sm:self-auto disabled:opacity-50"
          >
            {isLoadingMirror ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#C97C4C]" />
                <span>Reflecting All Pages...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-[#C97C4C]" />
                <span>
                  {emotionalMirror ? 'Refresh Emotional Mirror' : 'Consult Emotional Mirror'}
                </span>
              </>
            )}
          </button>
        </div>

        {/* Error alert */}
        {mirrorError && (
          <div className="p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#991B1B]">
            {mirrorError}
          </div>
        )}

        {/* Loading Shimmer Card */}
        {isLoadingMirror && (
          <div className="p-8 rounded-2xl bg-[#FAF6EE] border border-[#E8DFC8] text-center space-y-3 animate-pulse">
            <Sparkles className="w-7 h-7 text-[#C97C4C] animate-spin mx-auto" />
            <h4 className="text-sm font-display font-semibold text-[#2B231F]">
              Holding Up the Mirror across your {entries.length} notebook entries...
            </h4>
            <p className="text-xs text-[#7C7067] font-serif max-w-md mx-auto">
              Synthesizing emotional patterns, recurring moods, and reflections to reveal your primary feelings.
            </p>
          </div>
        )}

        {/* Mirror Empty State (Before first consult) */}
        {!emotionalMirror && !isLoadingMirror && (
          <div className="p-8 rounded-2xl bg-[#FAF6EE]/80 border border-dashed border-[#D9CEBA] text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FAF0E8] border border-[#C97C4C]/30 text-[#C97C4C] flex items-center justify-center mx-auto text-xl shadow-2xs">
              🪞
            </div>
            <h4 className="font-display text-base font-semibold text-[#2B231F]">
              Discover Your Most Frequent Emotional Feeling
            </h4>
            <p className="text-xs sm:text-sm text-[#7C7067] font-serif max-w-md mx-auto">
              {entries.length > 0
                ? `Click 'Consult Emotional Mirror' to analyze all ${entries.length} notebook pages written across the app and see what feeling lives most in your heart.`
                : "Begin writing entries in your notebook. As you write, the AI Emotional Mirror will detect and analyze your primary feelings."}
            </p>
            {entries.length > 0 && (
              <button
                onClick={handleConsultEmotionalMirror}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#C97C4C] hover:bg-[#B36838] text-white text-xs font-semibold shadow-2xs transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Consult Emotional Mirror Now</span>
              </button>
            )}
          </div>
        )}

        {/* Display Emotional Mirror Results */}
        {emotionalMirror && !isLoadingMirror && (
          <div className="space-y-6 animate-fade-in relative z-10">
            {/* Primary Most Prevalent Feeling Card */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-[#FAF0E8] to-[#FFF7ED] border border-[#EAD7C4] shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-[#E5DAC4] flex items-center justify-center text-2xl shadow-xs">
                    {emotionalMirror.primaryFeelingEmoji || '🌿'}
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-[#C97C4C] uppercase tracking-wider block">
                      Most Prevalent Feeling Across All History Entries
                    </span>
                    <h4 className="font-display text-2xl sm:text-3xl font-bold text-[#2B231F] mt-0.5">
                      {emotionalMirror.primaryFeeling}
                    </h4>
                  </div>
                </div>

                <div className="text-[11px] text-[#8C8075] bg-white/80 px-3 py-1.5 rounded-xl border border-[#E5DAC4] self-start sm:self-auto flex items-center space-x-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-[#C97C4C]" />
                  <span>{entries.length} pages synthesized</span>
                </div>
              </div>

              {/* Detailed Summary Analysis of why user has this feeling the most */}
              <div className="p-4 rounded-2xl bg-white/70 border border-[#E8DFC8]/60">
                <p className="text-xs sm:text-sm text-[#3E342F] font-serif leading-relaxed">
                  {emotionalMirror.primaryFeelingSummary}
                </p>
              </div>
            </div>

            {/* Feelings Spectrum Breakdown */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-[#8C8075] uppercase tracking-wider flex items-center space-x-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-[#C97C4C]" />
                  <span>Emotional Feeling Spectrum</span>
                </h4>
                <span className="text-[11px] text-[#8C8075]">Distribution across all writings</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(emotionalMirror.feelingBreakdown || []).map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-[#FAF6EE] border border-[#EFE7D8] space-y-2 shadow-2xs"
                  >
                    <div className="flex items-center justify-between text-xs font-semibold text-[#2B231F]">
                      <span>{item.feeling}</span>
                      <span className="text-[#C97C4C]">{item.percentage}%</span>
                    </div>

                    <div className="h-2 w-full bg-[#E8DFC8] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#C97C4C] transition-all duration-700"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>

                    <p className="text-[11px] text-[#6E625A] font-serif leading-tight">
                      {item.insight}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Evolution & Context Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Emotional Evolution */}
              <div className="p-4 rounded-2xl bg-[#FAF6EE] border border-[#EFE7D8] space-y-2">
                <div className="flex items-center space-x-1.5 text-[#4D7C5F]">
                  <Compass className="w-3.5 h-3.5" />
                  <h5 className="text-xs font-bold uppercase tracking-wider">
                    How Your Feelings Have Traveled
                  </h5>
                </div>
                <p className="text-xs text-[#3E342F] font-serif leading-relaxed">
                  {emotionalMirror.emotionalEvolution}
                </p>
              </div>

              {/* Recurring Themes */}
              <div className="p-4 rounded-2xl bg-[#FAF6EE] border border-[#EFE7D8] space-y-2">
                <div className="flex items-center space-x-1.5 text-[#3B82F6]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <h5 className="text-xs font-bold uppercase tracking-wider">
                    Recurring Emotional Themes
                  </h5>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(emotionalMirror.recurringThemes || []).map((theme, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-xl bg-white border border-[#E8DFC8] text-[11px] font-medium text-[#4A3F39] shadow-2xs"
                    >
                      ✨ {theme}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Gentle Closing Affirmation */}
            <div className="p-4 rounded-2xl bg-[#FAF0E8]/50 border border-[#EBD6C3] flex items-start space-x-3 text-xs text-[#52443C] font-serif">
              <Heart className="w-4 h-4 text-[#C97C4C] flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-[#2B231F] block font-sans text-xs">
                  Mirror Affirmation
                </span>
                <p className="mt-0.5 leading-relaxed">
                  {emotionalMirror.gentleEncouragement}
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 7-Day Mood Flow Section */}
      <section className="bg-[#FFFDF9] border border-[#E8DFC8] rounded-3xl p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F0E7D6] pb-4">
          <div>
            <div className="flex items-center space-x-2 text-[#C97C4C]">
              <TrendingUp className="w-4 h-4" />
              <h3 className="font-display text-lg font-semibold text-[#2B231F]">
                7-Day Mood Flow
              </h3>
            </div>
            <p className="text-xs text-[#7C7067] font-serif mt-0.5">
              A gentle visualization of your daily emotional landscape over the past week.
            </p>
          </div>
          <span className="text-xs text-[#8C8075] bg-[#F7F2E7] px-3 py-1 rounded-full border border-[#E8DFC8] self-start sm:self-auto font-medium">
            Last 7 Days
          </span>
        </div>

        <div className="grid grid-cols-7 gap-2 sm:gap-4 text-center">
          {past7Days.map((day, idx) => {
            const meta = day.mood ? MOODS[day.mood] : null;
            return (
              <div 
                key={idx} 
                className="flex flex-col items-center p-2.5 sm:p-3 rounded-2xl bg-[#FAF6EE] border border-[#EFE7D8] hover:border-[#C97C4C] transition-all"
              >
                <span className="text-[10px] sm:text-xs font-semibold text-[#66574C]">
                  {day.dayName}
                </span>
                <span className="text-[9px] text-[#A89C8F] mb-2">
                  {day.dayMonth}
                </span>
                
                <div 
                  className={`w-9 h-9 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center p-1.5 transition-transform hover:scale-110 ${
                    meta ? 'shadow-2xs bg-[#FFF8EE] border border-[#EAE1CF]' : 'bg-[#E8DFD0]/50 text-transparent'
                  }`}
                  title={meta ? `${meta.label} (${day.entriesCount} entries)` : 'No mood logged'}
                >
                  {day.mood ? <MoodIcon mood={day.mood} className="w-full h-full" showGlow={false} /> : <span>·</span>}
                </div>

                <span className="text-[10px] sm:text-[11px] font-medium text-[#4A3F39] mt-2 truncate max-w-full">
                  {meta ? meta.label : 'Quiet'}
                </span>

                {day.entriesCount > 0 && (
                  <span className="text-[9px] text-[#C97C4C] font-semibold mt-1">
                    {day.entriesCount} {day.entriesCount === 1 ? 'page' : 'pages'}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Mood Distribution & Template Habits Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mood Distribution Card */}
        <section className="bg-[#FFFDF9] border border-[#E8DFC8] rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#F0E7D6] pb-3">
            <div className="flex items-center space-x-2 text-[#4D7C5F]">
              <Smile className="w-4 h-4" />
              <h3 className="font-display text-base font-semibold text-[#2B231F]">
                Mood Balance
              </h3>
            </div>
            <span className="text-[11px] text-[#8C8075]">
              {totalMoodEvents} total logs
            </span>
          </div>

          <div className="space-y-3">
            {(Object.keys(MOODS) as MoodType[]).map((moodKey) => {
              const meta = MOODS[moodKey];
              const count = moodDistribution[moodKey];
              const pct = totalMoodEvents > 0 ? Math.round((count / totalMoodEvents) * 100) : 0;

              return (
                <div key={moodKey} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center space-x-2 font-medium text-[#2B231F]">
                      <div className="w-4 h-4 flex-shrink-0">
                        <MoodIcon mood={moodKey} className="w-4 h-4" showGlow={false} />
                      </div>
                      <span>{meta.label}</span>
                    </span>
                    <span className="text-[#8C8075] text-[11px]">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-[#EFE8D8] rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${pct}%`,
                        backgroundColor: meta.color
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Template Habits Card */}
        <section className="bg-[#FFFDF9] border border-[#E8DFC8] rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#F0E7D6] pb-3">
            <div className="flex items-center space-x-2 text-[#C97C4C]">
              <BarChart2 className="w-4 h-4" />
              <h3 className="font-display text-base font-semibold text-[#2B231F]">
                Journaling Habits
              </h3>
            </div>
            <span className="text-[11px] text-[#8C8075]">
              By Template
            </span>
          </div>

          {entries.length > 0 ? (
            <div className="space-y-3">
              {JOURNAL_TEMPLATES.map((tmpl) => {
                const count = templateUsage[tmpl.title] || 0;
                const pct = entries.length > 0 ? Math.round((count / entries.length) * 100) : 0;

                return (
                  <div key={tmpl.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-[#2B231F] truncate pr-2">
                        {tmpl.title}
                      </span>
                      <span className="text-[#8C8075] text-[11px] flex-shrink-0">
                        {count} {count === 1 ? 'page' : 'pages'} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-[#EFE8D8] rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-[#C97C4C] transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-[#8C8075] font-serif">
              Begin writing in your notebook to uncover your journaling preferences.
            </div>
          )}
        </section>
      </div>

      {/* Recent Notebook Entries Trail */}
      {entries.length > 0 && (
        <section className="bg-[#FFFDF9] border border-[#E8DFC8] rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#F0E7D6] pb-3">
            <div className="flex items-center space-x-2 text-[#2B231F]">
              <BookOpen className="w-4 h-4 text-[#4D7C5F]" />
              <h3 className="font-display text-base font-semibold">
                Recent Notebook Highlights
              </h3>
            </div>
            <span className="text-xs text-[#8C8075]">
              Last {Math.min(entries.length, 5)} pages
            </span>
          </div>

          <div className="space-y-2.5">
            {entries.slice(0, 5).map((entry) => {
              const moodMeta = MOODS[entry.mood];
              return (
                <div
                  key={entry.id}
                  onClick={() => onViewEntry && onViewEntry(entry)}
                  className={`p-3.5 rounded-2xl bg-[#FAF6EE] border border-[#EFE7D8] hover:border-[#C97C4C] transition-all flex items-center justify-between gap-3 ${
                    onViewEntry ? 'cursor-pointer' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center p-1.5 flex-shrink-0 shadow-2xs bg-[#FFF8EE] border border-[#EAE1CF]">
                      <MoodIcon mood={entry.mood} className="w-full h-full" showGlow={false} />
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="text-xs sm:text-sm font-semibold text-[#2B231F] truncate">
                        {entry.title || entry.templateTitle}
                      </h4>
                      <p className="text-[11px] text-[#6E625A] font-serif line-clamp-1">
                        {entry.text}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 flex-shrink-0 text-[11px] text-[#8C8075]">
                    <span>
                      {new Date(entry.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                    {onViewEntry && (
                      <ArrowRight className="w-3.5 h-3.5 text-[#C97C4C]" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};

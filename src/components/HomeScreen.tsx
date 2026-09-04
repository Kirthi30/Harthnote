import React, { useState } from 'react';
import { 
  Sparkles, 
  Sun, 
  Moon, 
  Compass, 
  Wind, 
  PenTool, 
  Flame, 
  ArrowRight, 
  CheckCircle2, 
  BookOpen,
  Calendar as CalendarIcon,
  ChevronRight,
  HeartHandshake
} from 'lucide-react';
import type { JournalEntry, MoodLog, MoodType, TemplateType, WeeklyReflection } from '../types';
import { JOURNAL_TEMPLATES, MOODS } from '../data/templates';
import { MoodIcon } from './MoodIcon';

interface HomeScreenProps {
  userName: string;
  onGeneralWrite: () => void;
  onSelectTemplate: (templateId: TemplateType) => void;
  onSelectMood: (mood: MoodType) => void;
  todayMood: MoodType | null;
  recentEntries: JournalEntry[];
  latestWeeklyReflection: WeeklyReflection | null;
  onViewEntry: (entry: JournalEntry) => void;
  onViewInsights: () => void;
  onViewHistory: () => void;
  onViewAllEntries?: () => void;
  streakCount: number;
  moodLogsLast7Days: MoodLog[];
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  userName,
  onGeneralWrite,
  onSelectTemplate,
  onSelectMood,
  todayMood,
  recentEntries,
  latestWeeklyReflection: _latestWeeklyReflection,
  onViewEntry,
  onViewInsights,
  onViewHistory,
  onViewAllEntries,
  streakCount,
  moodLogsLast7Days,
}) => {
  const [moodLoggedNotice, setMoodLoggedNotice] = useState(false);

  // Time-of-day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

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

  const handleMoodClick = (mood: MoodType) => {
    onSelectMood(mood);
    setMoodLoggedNotice(true);
    setTimeout(() => setMoodLoggedNotice(false), 2800);
  };

  // Build 7-day dot trail
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  const past7Days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(today.getDate() - (6 - i));
    const iso = d.toISOString().split('T')[0];
    const log = moodLogsLast7Days.find((l) => l.date === iso);
    return {
      date: iso,
      dayName: daysOfWeek[d.getDay()],
      dayNum: d.getDate(),
      isToday: i === 6,
      mood: log ? log.mood : null,
    };
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-9">
      {/* Top Greeting & Gentle Mindfulness */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E8DFC8] pb-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#C97C4C]">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[#2B231F] mt-1">
            {getGreeting()}, {userName.split(' ')[0] || 'friend'}.
          </h2>
          <p className="text-sm text-[#7C7067] font-serif mt-1 italic">
            "Give yourself permission to write without judgment today."
          </p>
        </div>

        {/* 7-Day Subtle Dot Rhythm */}
        <div className="bg-[#FFFDF9] border border-[#E8DFC8] rounded-2xl p-3.5 shadow-xs flex items-center space-x-3 self-start md:self-auto">
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold text-[#8C8075] uppercase tracking-wider">7-Day Rhythm</span>
            <span className="text-xs font-bold text-[#2B231F] flex items-center space-x-1">
              <Flame className="w-3.5 h-3.5 text-[#C97C4C] fill-[#C97C4C]/20" />
              <span>{streakCount} {streakCount === 1 ? 'day' : 'days'} streak</span>
            </span>
          </div>

          <div className="flex items-center space-x-1.5 pl-2 border-l border-[#EFE7D8]">
            {past7Days.map((d, idx) => {
              const moodMeta = d.mood ? MOODS[d.mood] : null;
              return (
                <div key={idx} className="flex flex-col items-center space-y-1" title={`${d.dayName}: ${moodMeta?.label || 'No entry'}`}>
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center p-0.5 transition-transform ${
                      moodMeta 
                        ? 'shadow-2xs hover:scale-110 bg-[#FFF8EE]' 
                        : d.isToday 
                        ? 'border-2 border-dashed border-[#C97C4C] bg-transparent' 
                        : 'bg-[#EADFCE]'
                    }`}
                  >
                    {d.mood ? <MoodIcon mood={d.mood} className="w-full h-full" showGlow={false} /> : null}
                  </div>
                  <span className={`text-[9px] ${d.isToday ? 'font-bold text-[#C97C4C]' : 'text-[#8C8075]'}`}>
                    {d.dayName[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Daily Mood Check-In Section */}
      <section className="bg-[#FFFDF9] border border-[#E8DFC8] rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display font-semibold text-lg text-[#2B231F]">
              How does your heart feel right now?
            </h3>
            <p className="text-xs text-[#7C7067] font-serif">
              A 1-tap check-in to gently ground this moment.
            </p>
          </div>

          {todayMood && (
            <span className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[#FAF0E8] text-[#C97C4C] border border-[#E8DFC8]">
              <MoodIcon mood={todayMood} className="w-4 h-4" showGlow={false} />
              <span>Logged: {MOODS[todayMood]?.label}</span>
            </span>
          )}
        </div>

        {/* Comprehensive Emotional Mood Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {(Object.keys(MOODS) as MoodType[]).map((moodKey) => {
            const mood = MOODS[moodKey];
            const isSelected = todayMood === moodKey;
            const getMoodSubtitle = (type: MoodType) => {
              switch (type) {
                case 'radiant': return 'Bright & Joyful';
                case 'calm': return 'Peaceful & Steady';
                case 'hopeful': return 'Optimistic & Inspired';
                case 'reflective': return 'Contemplative';
                case 'tender': return 'Soft & Sensitive';
                case 'anxious': return 'Uneasy & Restless';
                case 'sad': return 'Down & Heavy';
                case 'angry': return 'Frustrated & Fiery';
                case 'overwhelmed': return 'Flooded & Pressured';
                case 'weary': return 'Tired & Exhausted';
                default: return '';
              }
            };
            return (
              <button
                key={moodKey}
                onClick={() => handleMoodClick(moodKey)}
                className={`flex flex-col items-center p-3.5 rounded-2xl border transition-all cursor-pointer text-center group ${
                  isSelected
                    ? 'border-[#C97C4C] bg-[#FAF0E8] shadow-xs ring-1 ring-[#C97C4C]'
                    : 'border-[#EAE1CF] bg-[#FFFDF9] hover:bg-[#F9F5EC] hover:border-[#D6C7AE]'
                }`}
              >
                <div className="w-12 h-12 mb-2 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <MoodIcon mood={mood.type} className="w-12 h-12" />
                </div>
                <span className="text-xs font-semibold text-[#2B231F]">
                  {mood.label}
                </span>
                <span className="text-[10px] text-[#8C8075] mt-0.5 line-clamp-1">
                  {getMoodSubtitle(mood.type)}
                </span>
              </button>
            );
          })}
        </div>

        {todayMood && (
          <div className="p-3.5 rounded-2xl bg-[#FAF0E8] border border-[#EAD7C8] flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center space-x-2.5 text-xs font-medium text-[#7A4B29]">
              <div className="w-6 h-6 flex-shrink-0">
                <MoodIcon mood={todayMood} className="w-6 h-6" showGlow={false} />
              </div>
              <span>Feeling <strong>{MOODS[todayMood]?.label}</strong> today. Ready to write?</span>
            </div>
            <button
              id="home-write-with-mood-btn"
              onClick={onGeneralWrite}
              className="px-4 py-2 rounded-xl bg-[#C97C4C] hover:bg-[#B46A3B] text-[#FFFDF9] text-xs font-semibold transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer self-stretch sm:self-auto justify-center"
            >
              <span>Write</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </section>

      {/* Templates Section */}
      <section className="space-y-4">
        <div>
          <h3 className="font-display font-semibold text-xl text-[#2B231F]">
            Choose a Template for Today
          </h3>
          <p className="text-xs text-[#7C7067] font-serif">
            Structured questions to inspire gentle reflection, or open ivory paper.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
          {JOURNAL_TEMPLATES.map((tmpl) => {
            const Icon = getTemplateIcon(tmpl.iconName);
            return (
              <div
                key={tmpl.id}
                id={`home-template-card-${tmpl.id}`}
                onClick={() => onSelectTemplate(tmpl.id)}
                className="p-5 rounded-2xl bg-[#FFFDF9] border border-[#E8DFC8] hover:border-[#C97C4C] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group space-y-3"
              >
                <div>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform" style={{ backgroundColor: tmpl.accentBg, color: tmpl.color }}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <h4 className="font-display font-semibold text-base text-[#2B231F] group-hover:text-[#C97C4C] transition-colors">
                    {tmpl.title}
                  </h4>
                  <p className="text-xs text-[#6E625A] font-serif leading-relaxed mt-1">
                    {tmpl.subtitle}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#F2EDE2] flex items-center justify-between text-[11px] text-[#8C8075]">
                  <span>{tmpl.questions.length > 0 ? `${tmpl.questions.length} gentle questions` : 'Open stream'}</span>
                  <span className="font-medium text-[#C97C4C] flex items-center space-x-0.5 group-hover:translate-x-0.5 transition-transform">
                    <span>Write</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Snapshot: Insights & Recent Entries */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Emotional Rhythm & Insights Snapshot */}
        <div className="bg-[#FFFDF9] border border-[#E8DFC8] rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center space-x-2 text-[#C97C4C] mb-2">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs font-semibold tracking-wider uppercase">Emotional Rhythm & Insights</span>
            </div>
            <h4 className="font-display font-semibold text-base text-[#2B231F]">
              Your Weekly Mood Flow
            </h4>

            <div className="mt-3 space-y-3">
              <div className="flex items-center justify-between text-xs text-[#7C7067]">
                <span>7-Day Activity</span>
                <span className="font-semibold text-[#2B231F]">{streakCount} {streakCount === 1 ? 'day' : 'days'} streak</span>
              </div>
              <div className="grid grid-cols-7 gap-1.5 pt-1 text-center">
                {past7Days.map((d, idx) => {
                  const meta = d.mood ? MOODS[d.mood] : null;
                  return (
                    <div key={idx} className="flex flex-col items-center space-y-1">
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center p-1 transition-transform ${
                          meta ? 'shadow-2xs bg-[#FFF8EE] border border-[#EAE1CF]' : 'bg-[#EFE8D8] text-transparent'
                        }`}
                      >
                        {d.mood ? <MoodIcon mood={d.mood} className="w-full h-full" showGlow={false} /> : <span>·</span>}
                      </div>
                      <span className="text-[9px] text-[#8C8075]">{d.dayName}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <button
            onClick={onViewInsights}
            className="w-full py-2 px-3 rounded-xl bg-[#FAF0E8] hover:bg-[#F4E3D5] text-[#C97C4C] font-semibold text-xs transition-colors flex items-center justify-center space-x-1.5"
          >
            <span>Open Insights</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Recent Entries Snapshot */}
        <div className="bg-[#FFFDF9] border border-[#E8DFC8] rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2 text-[#4D7C5F]">
                <BookOpen className="w-4 h-4" />
                <span className="text-xs font-semibold tracking-wider uppercase">Recent Entries</span>
              </div>
              <button
                onClick={onViewAllEntries || onViewHistory}
                className="text-[11px] text-[#C97C4C] hover:underline"
              >
                View all
              </button>
            </div>

            {recentEntries.length > 0 ? (
              <div className="space-y-2 mt-2">
                {recentEntries.slice(0, 2).map((entry) => {
                  return (
                    <div
                      key={entry.id}
                      onClick={() => onViewEntry(entry)}
                      className="p-3 rounded-xl bg-[#FBF8F1] border border-[#EAE1CF] hover:border-[#C97C4C] cursor-pointer transition-all flex items-start justify-between space-x-2"
                    >
                      <div className="overflow-hidden">
                        <div className="flex items-center space-x-1.5">
                          <div className="w-4 h-4 flex-shrink-0">
                            <MoodIcon mood={entry.mood} className="w-4 h-4" showGlow={false} />
                          </div>
                          <span className="text-xs font-semibold text-[#2B231F] truncate">
                            {entry.title || entry.templateTitle}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#6E625A] font-serif line-clamp-1 mt-0.5">
                          {entry.text}
                        </p>
                      </div>
                      <span className="text-[10px] text-[#8C8075] flex-shrink-0">
                        {new Date(entry.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-[#7C7067] font-serif mt-2">
                Your notebook is open and ready. Select a template above to begin your first reflection.
              </p>
            )}
          </div>

          <button
            onClick={onViewHistory}
            className="w-full py-2 px-3 rounded-xl bg-[#EFE8D8] hover:bg-[#E5DAC8] text-[#2B231F] font-semibold text-xs transition-colors flex items-center justify-center space-x-1.5"
          >
            <CalendarIcon className="w-3.5 h-3.5 text-[#7C7067]" />
            <span>View History</span>
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  List, 
  Search, 
  Filter, 
  Sparkles, 
  ArrowRight, 
  BookOpen, 
  ChevronLeft, 
  ChevronRight, 
  PenTool,
  Smile,
  Download
} from 'lucide-react';
import type { JournalEntry, MoodType, TemplateType } from '../types';
import { JOURNAL_TEMPLATES, MOODS } from '../data/templates';
import { MoodIcon } from './MoodIcon';

interface HistoryScreenProps {
  entries: JournalEntry[];
  onSelectEntry: (entry: JournalEntry) => void;
  onNewEntry: () => void;
  onOpenExport?: () => void;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({
  entries,
  onSelectEntry,
  onNewEntry,
  onOpenExport,
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplateFilter, setSelectedTemplateFilter] = useState<string>('all');
  const [selectedMoodFilter, setSelectedMoodFilter] = useState<string>('all');

  // Calendar State
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  // Filter entries
  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      // Search text or title
      const matchesSearch =
        searchQuery.trim() === '' ||
        e.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.templateTitle.toLowerCase().includes(searchQuery.toLowerCase());

      // Template filter
      const matchesTemplate =
        selectedTemplateFilter === 'all' || e.templateType === selectedTemplateFilter;

      // Mood filter
      const matchesMood =
        selectedMoodFilter === 'all' || e.mood === selectedMoodFilter;

      return matchesSearch && matchesTemplate && matchesMood;
    });
  }, [entries, searchQuery, selectedTemplateFilter, selectedMoodFilter]);

  // Calendar calculations
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday
  const totalDays = lastDayOfMonth.getDate();

  const prevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);

  // Group entries by date YYYY-MM-DD
  const entriesByDate = useMemo(() => {
    const map: Record<string, JournalEntry[]> = {};
    entries.forEach((e) => {
      const d = new Date(e.createdAt).toISOString().split('T')[0];
      if (!map[d]) map[d] = [];
      map[d].push(e);
    });
    return map;
  }, [entries]);

  const selectedDateEntries = selectedCalendarDate ? (entriesByDate[selectedCalendarDate] || []) : [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-7">
      {/* Header & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8DFC8] pb-5">
        <div>
          <h2 className="font-display text-3xl font-semibold text-[#2B231F]">
            History
          </h2>
          <p className="text-xs text-[#7C7067] font-serif mt-1">
            {entries.length} {entries.length === 1 ? 'journal entry' : 'journal entries'} recorded
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Calendar / List Toggle */}
          <div className="bg-[#EFE8D8] p-1 rounded-xl flex items-center space-x-1 border border-[#DDD1BE]">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                viewMode === 'list'
                  ? 'bg-[#FFFDF9] text-[#2B231F] shadow-xs'
                  : 'text-[#7C7067] hover:text-[#2B231F]'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                viewMode === 'calendar'
                  ? 'bg-[#FFFDF9] text-[#2B231F] shadow-xs'
                  : 'text-[#7C7067] hover:text-[#2B231F]'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Calendar</span>
            </button>
          </div>

          {onOpenExport && (
            <button
              onClick={onOpenExport}
              className="px-3.5 py-2 rounded-xl bg-[#FAF0E8] hover:bg-[#F4E3D5] text-[#C97C4C] font-semibold text-xs transition-colors flex items-center space-x-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Journal</span>
            </button>
          )}

          <button
            onClick={onNewEntry}
            className="px-4 py-2 rounded-xl bg-[#C97C4C] hover:bg-[#B46A3B] text-[#FFFDF9] font-medium text-xs shadow-xs transition-colors flex items-center space-x-1.5"
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Write Entry</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-[#FFFDF9] border border-[#E8DFC8] rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative w-full sm:flex-1">
            <Search className="w-4 h-4 text-[#8C8075] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by keywords, title, or memories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 bg-[#FAF6EE] border border-[#E0D5BF] rounded-xl focus:outline-hidden focus:ring-1 focus:ring-[#C97C4C] text-[#2B231F] placeholder:text-[#9C8F83]"
            />
          </div>

          {/* Template Filter Dropdown */}
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <select
              value={selectedTemplateFilter}
              onChange={(e) => setSelectedTemplateFilter(e.target.value)}
              className="text-xs bg-[#FAF6EE] border border-[#E0D5BF] rounded-xl px-3 py-2 text-[#2B231F] focus:outline-hidden focus:ring-1 focus:ring-[#C97C4C] cursor-pointer w-full sm:w-auto"
            >
              <option value="all">All Templates</option>
              {JOURNAL_TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>

            {/* Mood Filter Dropdown */}
            <select
              value={selectedMoodFilter}
              onChange={(e) => setSelectedMoodFilter(e.target.value)}
              className="text-xs bg-[#FAF6EE] border border-[#E0D5BF] rounded-xl px-3 py-2 text-[#2B231F] focus:outline-hidden focus:ring-1 focus:ring-[#C97C4C] cursor-pointer w-full sm:w-auto"
            >
              <option value="all">All Moods</option>
              {(Object.keys(MOODS) as MoodType[]).map((mKey) => (
                <option key={mKey} value={mKey}>
                  {MOODS[mKey].emoji} {MOODS[mKey].label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Mode 1: List View */}
      {viewMode === 'list' && (
        <div className="space-y-3.5">
          {filteredEntries.length === 0 ? (
            <div className="bg-[#FFFDF9] border border-[#E8DFC8] rounded-3xl p-10 text-center space-y-3">
              <BookOpen className="w-10 h-10 text-[#C4B9A7] mx-auto stroke-1" />
              <h3 className="font-display font-semibold text-lg text-[#2B231F]">
                No entries match your search
              </h3>
              <p className="text-xs text-[#7C7067] font-serif max-w-sm mx-auto">
                Try clearing your search terms or open a new page in your notebook.
              </p>
              <button
                onClick={onNewEntry}
                className="mt-2 px-4 py-2 rounded-xl bg-[#FAF0E8] text-[#C97C4C] text-xs font-semibold hover:bg-[#F4E3D5] transition-colors"
              >
                Write a New Entry
              </button>
            </div>
          ) : (
            filteredEntries.map((entry) => {
              const moodMeta = MOODS[entry.mood];
              return (
                <div
                  key={entry.id}
                  onClick={() => onSelectEntry(entry)}
                  className="bg-[#FFFDF9] border border-[#E8DFC8] hover:border-[#C97C4C] hover:shadow-md transition-all rounded-2xl p-5 cursor-pointer space-y-3 group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 flex-shrink-0">
                        <MoodIcon mood={entry.mood} className="w-5 h-5" showGlow={false} />
                      </div>
                      <span className="text-xs font-semibold text-[#8C8075]">
                        {entry.templateTitle}
                      </span>
                      <span className="text-xs text-[#C4B9A7]">·</span>
                      <span className="text-xs font-medium text-[#7C7067]">
                        {new Date(entry.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] text-[#8C8075] bg-[#FAF6EE] px-2 py-0.5 rounded-md border border-[#EFE7D8]">
                        {entry.wordCount} words
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-display font-semibold text-base text-[#2B231F] group-hover:text-[#C97C4C] transition-colors">
                      {entry.title || entry.templateTitle}
                    </h4>
                    <p className="text-xs text-[#665950] font-serif line-clamp-2 mt-1 leading-relaxed">
                      {entry.text}
                    </p>
                  </div>

                  {entry.aiReflection && !entry.aiReflectionDismissed && (
                    <div className="pt-2 border-t border-[#F2ECE0] flex items-center space-x-1.5 text-[11px] text-[#C97C4C] font-serif italic">
                      <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="line-clamp-1">"{entry.aiReflection}"</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Mode 2: Calendar View */}
      {viewMode === 'calendar' && (
        <div className="space-y-6">
          <div className="bg-[#FFFDF9] border border-[#E8DFC8] rounded-3xl p-6 shadow-xs space-y-4">
            {/* Month Header */}
            <div className="flex items-center justify-between">
              <h3 className="font-display font-semibold text-lg text-[#2B231F]">
                {currentMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
              </h3>
              <div className="flex items-center space-x-1">
                <button
                  onClick={prevMonth}
                  className="p-1.5 rounded-lg hover:bg-[#EFE8D8] text-[#7C7067] hover:text-[#2B231F]"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={nextMonth}
                  className="p-1.5 rounded-lg hover:bg-[#EFE8D8] text-[#7C7067] hover:text-[#2B231F]"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Weekday Labels */}
            <div className="grid grid-cols-7 gap-1 text-center font-semibold text-[11px] text-[#8C8075] pb-2 border-b border-[#EFE7D8]">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1.5">
              {/* Empty leading padding days */}
              {[...Array(startDayOfWeek)].map((_, i) => (
                <div key={`empty-${i}`} className="min-h-[56px] rounded-xl bg-transparent opacity-30" />
              ))}

              {/* Month Days */}
              {[...Array(totalDays)].map((_, i) => {
                const dayNum = i + 1;
                const d = new Date(year, month, dayNum);
                const iso = d.toISOString().split('T')[0];
                const dayEntries = entriesByDate[iso] || [];
                const hasEntries = dayEntries.length > 0;
                const isSelected = selectedCalendarDate === iso;
                const isToday = iso === new Date().toISOString().split('T')[0];

                return (
                  <div
                    key={`day-${dayNum}`}
                    onClick={() => hasEntries && setSelectedCalendarDate(iso)}
                    className={`min-h-[56px] p-1.5 rounded-xl border flex flex-col justify-between transition-all ${
                      isSelected
                        ? 'border-[#C97C4C] bg-[#FAF0E8] shadow-xs'
                        : hasEntries
                        ? 'border-[#E2D8C3] bg-[#FFFDF9] hover:border-[#C97C4C] cursor-pointer'
                        : 'border-[#F2ECE0] bg-[#FAF6EE]/50 text-[#A89D91]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[11px] ${isToday ? 'font-bold text-[#C97C4C]' : 'font-medium'}`}>
                        {dayNum}
                      </span>
                      {hasEntries && (
                        <div className="w-4 h-4 flex-shrink-0">
                          <MoodIcon mood={dayEntries[0].mood} className="w-4 h-4" showGlow={false} />
                        </div>
                      )}
                    </div>

                    {hasEntries && (
                      <div className="flex space-x-1 justify-end">
                        {dayEntries.map((e, idx) => (
                          <div
                            key={idx}
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: MOODS[e.mood]?.color || '#C97C4C' }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Date Entries Panel */}
          {selectedCalendarDate && (
            <div className="bg-[#FFFDF9] border border-[#E8DFC8] rounded-3xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-display font-semibold text-base text-[#2B231F]">
                  Entries on {new Date(selectedCalendarDate + 'T00:00:00').toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                </h4>
                <button
                  onClick={() => setSelectedCalendarDate(null)}
                  className="text-xs text-[#7C7067] hover:underline"
                >
                  Clear Selection
                </button>
              </div>

              <div className="space-y-2">
                {selectedDateEntries.map((entry) => (
                  <div
                    key={entry.id}
                    onClick={() => onSelectEntry(entry)}
                    className="p-3.5 rounded-xl bg-[#FAF6EE] border border-[#EAE1CF] hover:border-[#C97C4C] cursor-pointer flex items-center justify-between transition-all"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 flex-shrink-0">
                          <MoodIcon mood={entry.mood} className="w-4 h-4" showGlow={false} />
                        </div>
                        <span className="text-xs font-semibold text-[#2B231F]">
                          {entry.title || entry.templateTitle}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#6E625A] font-serif line-clamp-1 mt-0.5">
                        {entry.text}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#C97C4C]" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

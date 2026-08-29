export type MoodType = 'radiant' | 'calm' | 'reflective' | 'tender' | 'weary';

export interface MoodMeta {
  type: MoodType;
  label: string;
  emoji: string;
  color: string;
  bgLight: string;
  borderLight: string;
  description: string;
}

export type AIMemoryLevel = 'none' | 'light' | 'deep';

export type TemplateType = 'gratitude' | 'reflection' | 'goals' | 'freewrite' | 'clarity';

export interface TemplateQuestion {
  id: string;
  label: string;
  placeholder: string;
}

export interface JournalTemplate {
  id: TemplateType;
  title: string;
  subtitle: string;
  iconName: string;
  color: string;
  accentBg: string;
  questions: TemplateQuestion[];
  starterPrompt: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  templateType: TemplateType;
  templateTitle: string;
  title?: string;
  text: string;
  promptAnswers?: Record<string, string>;
  mood: MoodType;
  moodLabel: string;
  wordCount: number;
  aiReflection?: string;
  aiReflectionDismissed?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface MoodLog {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  mood: MoodType;
  moodLabel: string;
  note?: string;
  createdAt: number;
}

export interface WeeklyReflection {
  id: string;
  userId: string;
  weekStartDate: string;
  weekEndDate: string;
  moodTrendSummary: string;
  themes: string[];
  reflectionQuestions: string[];
  inquiryAnswers?: Record<string, string>;
  userNotes?: string;
  entriesCount: number;
  createdAt: number;
  savedAt?: number;
}

export interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  aiMemoryLevel: AIMemoryLevel;
  pinEnabled: boolean;
  pinHash?: string;
  reminderTime?: string;
  streakCount: number;
  lastJournalDate?: string;
  createdAt: number;
}

export type AppView = 'home' | 'write' | 'history' | 'insights' | 'settings';

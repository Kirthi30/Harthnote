export type MoodType = 
  | 'radiant' 
  | 'calm' 
  | 'hopeful' 
  | 'reflective' 
  | 'tender' 
  | 'anxious' 
  | 'sad' 
  | 'angry' 
  | 'overwhelmed' 
  | 'weary';

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

export type WriteEntrySource = 'general_write' | 'template_selection' | 'blank_page' | 'direct';

export type TemplateType = 
  | 'blank'
  | 'freewrite' 
  | 'morning_intention' 
  | 'evening_unwind' 
  | 'decision_clarity' 
  | 'gratitude_light' 
  | 'tough_moment'
  | 'gratitude' 
  | 'reflection' 
  | 'goals' 
  | 'clarity';

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
  inspiredQuote?: string;
  inspiredQuoteAuthor?: string;
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

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: number;
  timeLabel?: string;
  questionIndex?: number;
}

export interface ReflectionChatSession {
  id: string;
  userId: string;
  title?: string;
  weeklyReflectionId?: string;
  weeklyReflectionDate?: string;
  firstQuestion: string;
  messages: ChatMessage[];
  messageCount?: number;
  summary?: string;
  createdAt: number;
  completedAt: number;
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

export interface EmotionalMirrorAnalysis {
  primaryFeeling: string;
  primaryFeelingEmoji?: string;
  primaryFeelingSummary: string;
  feelingBreakdown: Array<{
    feeling: string;
    percentage: number;
    insight: string;
  }>;
  recurringThemes: string[];
  emotionalEvolution: string;
  gentleEncouragement: string;
  totalEntriesAnalyzed: number;
  lastAnalyzedAt: number;
}

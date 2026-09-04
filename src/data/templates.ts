import type { JournalTemplate, MoodMeta, MoodType, TemplateType } from '../types';

export const MOODS: Record<MoodType, MoodMeta> = {
  radiant: {
    type: 'radiant',
    label: 'Radiant',
    emoji: '☀️',
    color: '#D97706',
    bgLight: '#FEF3C7',
    borderLight: '#FDE68A',
    description: 'Bright, joyful, energised, and full of light',
  },
  calm: {
    type: 'calm',
    label: 'Calm',
    emoji: '🌿',
    color: '#4D7C5F',
    bgLight: '#E8F2EB',
    borderLight: '#CFE5D5',
    description: 'Grounded, peaceful, steady, and at ease',
  },
  hopeful: {
    type: 'hopeful',
    label: 'Hopeful',
    emoji: '✨',
    color: '#2563EB',
    bgLight: '#EFF6FF',
    borderLight: '#BFDBFE',
    description: 'Inspired, optimistic, grateful, and expectant',
  },
  reflective: {
    type: 'reflective',
    label: 'Reflective',
    emoji: '🍂',
    color: '#9C623C',
    bgLight: '#F9EFE7',
    borderLight: '#F0DEC8',
    description: 'Contemplative, observant, thoughtful, and searching',
  },
  tender: {
    type: 'tender',
    label: 'Tender',
    emoji: '🌸',
    color: '#B26B88',
    bgLight: '#FCE7F0',
    borderLight: '#F9CFE0',
    description: 'Sensitive, soft, vulnerable, and gentle',
  },
  anxious: {
    type: 'anxious',
    label: 'Anxious',
    emoji: '⚡',
    color: '#C05621',
    bgLight: '#FEEBC8',
    borderLight: '#FBD38D',
    description: 'Uneasy, restless, nervous, or tense',
  },
  sad: {
    type: 'sad',
    label: 'Sad',
    emoji: '💧',
    color: '#4A5568',
    bgLight: '#EDF2F7',
    borderLight: '#CBD5E0',
    description: 'Downhearted, grieving, tearful, or heavy-hearted',
  },
  angry: {
    type: 'angry',
    label: 'Angry',
    emoji: '🔥',
    color: '#C53030',
    bgLight: '#FED7D7',
    borderLight: '#FEB2B2',
    description: 'Frustrated, irritated, resentful, or turbulent',
  },
  overwhelmed: {
    type: 'overwhelmed',
    label: 'Overwhelmed',
    emoji: '🌪️',
    color: '#6B46C1',
    bgLight: '#EBF8FF',
    borderLight: '#D6BCFA',
    description: 'Flooded, crowded mind, or under intense pressure',
  },
  weary: {
    type: 'weary',
    label: 'Weary',
    emoji: '🌧️',
    color: '#64748B',
    bgLight: '#F1F5F9',
    borderLight: '#E2E8F0',
    description: 'Tired, heavy, seeking rest and quiet shelter',
  },
};

export const normalizeTemplateId = (id?: string | null): TemplateType => {
  if (!id) return 'freewrite';
  if (id === 'blank') return 'blank';
  if (id === 'gratitude' || id === 'gratitude_light') return 'gratitude_light';
  if (id === 'reflection' || id === 'evening_unwind') return 'evening_unwind';
  if (id === 'goals' || id === 'morning_intention') return 'morning_intention';
  if (id === 'clarity' || id === 'decision_clarity') return 'decision_clarity';
  if (id === 'tough_moment') return 'tough_moment';
  return 'freewrite';
};

export const BLANK_PAGE_TEMPLATE: JournalTemplate = {
  id: 'blank',
  title: 'Blank Page',
  subtitle: 'A completely open, unguided page for pure unfiltered writing.',
  iconName: 'FileText',
  color: '#5C544E',
  accentBg: '#F5F1EB',
  starterPrompt: 'Title (optional)',
  questions: [],
};

export const JOURNAL_TEMPLATES: JournalTemplate[] = [
  {
    id: 'freewrite',
    title: 'Freewrite',
    subtitle: 'Unfiltered, open stream of consciousness without rules.',
    iconName: 'PenTool',
    color: '#5C544E',
    accentBg: '#F5F1EB',
    starterPrompt: 'Writing freely without editing or judging my thoughts...',
    questions: [],
  },
  {
    id: 'morning_intention',
    title: 'Morning Intention',
    subtitle: 'Set a peaceful, deliberate tone before the day begins.',
    iconName: 'Compass',
    color: '#4D7C5F',
    accentBg: '#EAF3EC',
    starterPrompt: 'Instead of an overwhelming to-do list, my intention is...',
    questions: [
      {
        id: 'q1',
        label: 'How do you hope to feel in your body & mind today?',
        placeholder: 'Unhurried, focused, steady, curious, well-rested...',
      },
      {
        id: 'q2',
        label: 'What is the single most caring priority to attend to?',
        placeholder: 'One concrete task, conversation, or boundary that matters most...',
      },
      {
        id: 'q3',
        label: 'What small boundary or pause will you protect today?',
        placeholder: 'Stepping outside at noon, leaving work on time, putting phone away...',
      },
    ],
  },
  {
    id: 'evening_unwind',
    title: 'Evening Unwind',
    subtitle: 'Release the day’s noise and mark what truly mattered.',
    iconName: 'Moon',
    color: '#806857',
    accentBg: '#F3EFEA',
    starterPrompt: 'As the day settles down, my mind returns to...',
    questions: [
      {
        id: 'q1',
        label: 'What consumed most of your emotional energy today?',
        placeholder: 'A conversation, a deadline, an unspoken tension...',
      },
      {
        id: 'q2',
        label: 'What is one thing you can gently lay down before sleep?',
        placeholder: 'An expectation, tomorrow’s anxiety, an unfinished chore...',
      },
      {
        id: 'q3',
        label: 'What was the most genuine moment you experienced?',
        placeholder: 'When did you feel most like yourself or at peace today?',
      },
    ],
  },
  {
    id: 'decision_clarity',
    title: 'Decision Clarity',
    subtitle: 'Untangle conflicting choices and discover steady ground.',
    iconName: 'Wind',
    color: '#8A6D79',
    accentBg: '#F4ECEF',
    starterPrompt: 'The situation or decision weighing on me right now is...',
    questions: [
      {
        id: 'q1',
        label: 'What is the root tension, conflict, or uncertainty?',
        placeholder: 'Describe what feels heavy or unresolved in plain words...',
      },
      {
        id: 'q2',
        label: 'What is within your control, and what belongs to others or timing?',
        placeholder: 'My actions and responses vs. timing, opinions, outcomes...',
      },
      {
        id: 'q3',
        label: 'What would a deeply compassionate friend whisper to you?',
        placeholder: 'What gentle truth do you need to hear right now?',
      },
    ],
  },
  {
    id: 'gratitude_light',
    title: 'Gratitude & Light',
    subtitle: 'Notice the quiet details that brought warmth today.',
    iconName: 'Sparkles',
    color: '#C97C4C',
    accentBg: '#FAF0E8',
    starterPrompt: 'Today I noticed a quiet spark of gratitude in...',
    questions: [
      {
        id: 'q1',
        label: 'A sensory detail that brought a moment of peace',
        placeholder: 'The taste of morning tea, warm sun through the curtain, the quiet...',
      },
      {
        id: 'q2',
        label: 'A person, animal, or moment of connection',
        placeholder: 'A kind word, a shared look, someone who held space...',
      },
      {
        id: 'q3',
        label: 'Something you appreciate about yourself today',
        placeholder: 'How I listened, my patience, or simply showing up...',
      },
    ],
  },
  {
    id: 'tough_moment',
    title: 'Tough Moment',
    subtitle: 'Hold compassionate space for difficult feelings without rushing to fix them.',
    iconName: 'HeartHandshake',
    color: '#64748B',
    accentBg: '#F1F5F9',
    starterPrompt: 'Right now, what feels heavy or tender is...',
    questions: [
      {
        id: 'q1',
        label: 'What is hurting or feeling difficult right now?',
        placeholder: 'Name the feeling or situation as honestly as you can...',
      },
      {
        id: 'q2',
        label: 'Where do you feel this tension in your body, and can you soften a little around it?',
        placeholder: 'In my chest, shoulders, throat... taking one slow breath...',
      },
      {
        id: 'q3',
        label: 'What gentle kindness or permission can you give yourself today?',
        placeholder: 'I am allowed to rest, I do not have to have this figured out right now...',
      },
    ],
  },
];

export const getTemplateById = (id?: string | null): JournalTemplate => {
  const norm = normalizeTemplateId(id);
  if (norm === 'blank') return BLANK_PAGE_TEMPLATE;
  const found = JOURNAL_TEMPLATES.find((t) => t.id === norm);
  return found || JOURNAL_TEMPLATES[0];
};

export const SAMPLE_ENTRIES = [
  {
    id: 'sample-entry-1',
    userId: 'guest',
    templateType: 'gratitude' as TemplateType,
    templateTitle: 'Gratitude & Small Joys',
    title: 'Sunlight on the kitchen sill',
    text: 'Woke up a bit earlier than the alarm. The kettle whistled quietly and the morning light cut across the wooden floor like honey. Spent fifteen minutes just sitting with my coffee with no phone in hand.\n\nNoticed how much easier it was to breathe when I did not start the morning reading messages. Felt a genuine wave of gratitude for having a quiet roof and hot coffee.',
    promptAnswers: {
      q1: 'The steam rising from warm black tea in the early morning light.',
      q2: 'A sweet text from Maya checking in on my week.',
      q3: 'Honoring my promise to walk outside during lunchtime.',
    },
    mood: 'calm' as MoodType,
    moodLabel: 'Calm',
    wordCount: 78,
    aiReflection: 'You noticed how starting the day without screens gave your thoughts room to breathe. What small stillness can you protect tomorrow?',
    aiReflectionDismissed: false,
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'sample-entry-2',
    userId: 'guest',
    templateType: 'reflection' as TemplateType,
    templateTitle: 'Evening Reflection & Letting Go',
    title: 'Closing the notebook on a restless Wednesday',
    text: 'Mid-week friction at the office. Several deadlines got moved up and people were tense. I caught myself holding my breath in meetings and rushing my sentences.\n\nTonight I chose to close the laptop at 6:30 sharp. Made a warm bowl of soup, put on instrumental music, and let the unresolved emails stay until tomorrow. They will still be there, but I am choosing peace tonight.',
    promptAnswers: {
      q1: 'Unclear expectations around the quarterly review schedule.',
      q2: 'The urge to reply to late evening emails just to look responsive.',
      q3: 'Speaking up calmly when asked if the timeline was realistic.',
    },
    mood: 'reflective' as MoodType,
    moodLabel: 'Reflective',
    wordCount: 88,
    aiReflection: 'You drew a clear boundary between urgency and your own wellbeing tonight. How did your evening shift once you closed the laptop?',
    aiReflectionDismissed: false,
    createdAt: Date.now() - 86400000 * 1,
    updatedAt: Date.now() - 86400000 * 1,
  },
  {
    id: 'sample-entry-3',
    userId: 'guest',
    templateType: 'goals' as TemplateType,
    templateTitle: 'Gentle Intentions',
    title: 'Pacing myself for the weekend',
    text: 'Tomorrow is Friday. Instead of trying to squeeze three weeks of backlog into one afternoon, I will pick the top two priorities and finish them deliberately.\n\nPlanning to take a long evening walk near the park trees as a marker between work and the weekend.',
    promptAnswers: {
      q1: 'Unhurried and grounded in my own rhythm.',
      q2: 'Sending the final client summary before 3 PM.',
      q3: 'No screen time after 9 PM on Friday night.',
    },
    mood: 'radiant' as MoodType,
    moodLabel: 'Radiant',
    wordCount: 65,
    aiReflection: 'Setting boundaries ahead of time creates the space you need. What will signal to you that work is done for the week?',
    aiReflectionDismissed: false,
    createdAt: Date.now() - 86400000 * 0.2,
    updatedAt: Date.now() - 86400000 * 0.2,
  },
];

export const SAMPLE_WEEKLY_REFLECTION = {
  id: 'sample-weekly-1',
  userId: 'guest',
  weekStartDate: new Date(Date.now() - 86400000 * 6).toISOString().split('T')[0],
  weekEndDate: new Date().toISOString().split('T')[0],
  moodTrendSummary: 'Your week moved from mid-week urgency into intentional rest and steady presence. You repeatedly practiced setting compassionate boundaries when demands multiplied.',
  themes: [
    'Protecting quiet morning rituals',
    'Releasing the pressure to be constantly reactive',
    'Finding grounding in simple sensory moments',
  ],
  reflectionQuestions: [
    'When you closed your laptop early this week, what did that physical pause give back to you?',
    'Which small routine brought you the deepest sense of warmth over the last seven days?',
  ],
  inquiryAnswers: {
    q_0: 'It gave me back my quiet evening headspace and allowed me to cook dinner without rushed thoughts.',
    q_1: 'Drinking hot tea by the window before opening any email.',
  },
  userNotes: 'A peaceful reminder that pacing is sustainable.',
  entriesCount: 3,
  createdAt: Date.now() - 3600000 * 4,
  savedAt: Date.now() - 3600000 * 2,
};

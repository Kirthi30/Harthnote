import type { MoodType, TemplateType } from '../types';

export interface MoodTemplateSuggestion {
  mood: MoodType;
  moodLabel: string;
  moodEmoji: string;
  suggestedTemplateId: TemplateType;
  suggestedTemplateTitle: string;
  headline: string;
  contextText: string;
  explanation: string;
  buttonLabel: string;
}

export const MOOD_TEMPLATE_MAPPINGS: Record<MoodType, MoodTemplateSuggestion> = {
  sad: {
    mood: 'sad',
    moodLabel: 'Sad',
    moodEmoji: '💧',
    suggestedTemplateId: 'tough_moment',
    suggestedTemplateTitle: 'Tough Moment',
    headline: 'A gentle place to start 💙',
    contextText: "It sounds like you may have something heavy on your heart.",
    explanation: "This can help you gently explore what you're going through.",
    buttonLabel: 'Use Tough Moment',
  },
  weary: {
    mood: 'weary',
    moodLabel: 'Tired / Weary',
    moodEmoji: '🌧️',
    suggestedTemplateId: 'evening_unwind',
    suggestedTemplateTitle: 'Evening Unwind',
    headline: 'A gentle rest for your mind 🌙',
    contextText: "It sounds like your energy is low and your mind is ready to unwind.",
    explanation: "This can help you gently set down the weight of the day and prepare for rest.",
    buttonLabel: 'Use Evening Unwind',
  },
  overwhelmed: {
    mood: 'overwhelmed',
    moodLabel: 'Overwhelmed',
    moodEmoji: '🌪️',
    suggestedTemplateId: 'tough_moment',
    suggestedTemplateTitle: 'Tough Moment',
    headline: 'Finding steady ground 🍃',
    contextText: "It sounds like a lot is crowding your thoughts right now.",
    explanation: "This can help you step back, breathe, and find your footing one breath at a time.",
    buttonLabel: 'Use Tough Moment',
  },
  anxious: {
    mood: 'anxious',
    moodLabel: 'Anxious',
    moodEmoji: '⚡',
    suggestedTemplateId: 'tough_moment',
    suggestedTemplateTitle: 'Tough Moment',
    headline: 'Holding compassionate space 🌿',
    contextText: "When restlessness or tension is high, a safe container can bring ease.",
    explanation: "This can give you space to name what feels hard without pressure to fix it.",
    buttonLabel: 'Use Tough Moment',
  },
  angry: {
    mood: 'angry',
    moodLabel: 'Angry / Frustrated',
    moodEmoji: '🔥',
    suggestedTemplateId: 'tough_moment',
    suggestedTemplateTitle: 'Tough Moment',
    headline: 'Safe space to release 🔥',
    contextText: "Strong emotions and frustration deserve honest, judgment-free space.",
    explanation: "This gives your raw feelings room to be expressed safely and without judgment.",
    buttonLabel: 'Use Tough Moment',
  },
  tender: {
    mood: 'tender',
    moodLabel: 'Tender / Vulnerable',
    moodEmoji: '🌸',
    suggestedTemplateId: 'tough_moment',
    suggestedTemplateTitle: 'Tough Moment',
    headline: 'Gentle care for your tenderness 🌸',
    contextText: "Feeling sensitive or vulnerable is a sign of your deep capacity to care.",
    explanation: "This can help you treat yourself with softness, kindness, and understanding.",
    buttonLabel: 'Use Tough Moment',
  },
  reflective: {
    mood: 'reflective',
    moodLabel: 'Confused / Unsure',
    moodEmoji: '🍂',
    suggestedTemplateId: 'decision_clarity',
    suggestedTemplateTitle: 'Decision Clarity',
    headline: 'Untangling your thoughts 🍂',
    contextText: "When things feel uncertain or conflicting, stepping back brings light.",
    explanation: "This can help you untangle conflicting choices and discover steady ground.",
    buttonLabel: 'Use Decision Clarity',
  },
  radiant: {
    mood: 'radiant',
    moodLabel: 'Grateful / Happy',
    moodEmoji: '☀️',
    suggestedTemplateId: 'gratitude_light',
    suggestedTemplateTitle: 'Gratitude & Light',
    headline: 'Celebrating warmth & joy ☀️',
    contextText: "Your heart feels bright, uplifted, and full of goodness.",
    explanation: "This can help you capture the sparks of gratitude and warmth from today.",
    buttonLabel: 'Use Gratitude & Light',
  },
  hopeful: {
    mood: 'hopeful',
    moodLabel: 'Starting My Day / Inspired',
    moodEmoji: '✨',
    suggestedTemplateId: 'morning_intention',
    suggestedTemplateTitle: 'Morning Intention',
    headline: 'Channeling your inspiration ✨',
    contextText: "You have a sense of optimism and forward momentum right now.",
    explanation: "This can help you set a calm, deliberate tone and clarify what matters most.",
    buttonLabel: 'Use Morning Intention',
  },
  calm: {
    mood: 'calm',
    moodLabel: 'Calm / Peaceful',
    moodEmoji: '🌿',
    suggestedTemplateId: 'freewrite',
    suggestedTemplateTitle: 'Freewrite',
    headline: 'An open space for your mind 🌿',
    contextText: "Your mind is quiet, steady, and at ease.",
    explanation: "This open page gives you full freedom to write without guidelines or rules.",
    buttonLabel: 'Use Freewrite',
  },
};

export const DEFAULT_SUGGESTION: MoodTemplateSuggestion = {
  mood: 'calm',
  moodLabel: 'Neutral',
  moodEmoji: '🌿',
  suggestedTemplateId: 'freewrite',
  suggestedTemplateTitle: 'Freewrite',
  headline: 'A quiet space to write 🌿',
  contextText: "A peaceful canvas waiting for whatever is on your mind.",
  explanation: "Write freely without rules, structure, or judgment.",
  buttonLabel: 'Use Freewrite',
};

export const getSuggestedTemplateForMood = (mood?: MoodType | null): MoodTemplateSuggestion => {
  if (!mood) return DEFAULT_SUGGESTION;
  return MOOD_TEMPLATE_MAPPINGS[mood] || DEFAULT_SUGGESTION;
};

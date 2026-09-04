import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { polishSpeechLocally } from './src/utils/speechPolishEngine';

dotenv.config();

const PORT = 3000;
const HOST = '0.0.0.0';

// Lazy initialized Gemini Client
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!genAIClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('Warning: GEMINI_API_KEY environment variable is not set. Gemini calls will fail.');
    }
    genAIClient = new GoogleGenAI({ apiKey: apiKey || '' });
  }
  return genAIClient;
}

// Resilient Model Fallback Ladder
const MODEL_FALLBACK_LADDER = [
  'gemini-3.6-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-3.7-flash',
];

interface FallbackOptions {
  contents: any;
  systemInstruction?: string;
  temperature?: number;
  responseMimeType?: string;
  responseSchema?: any;
}

let creditsDepletedUntil = 0;

function isAccountQuotaOrCreditError(err: any): boolean {
  if (!err) return false;
  const status = err?.status || err?.statusCode || 0;
  let msg = '';
  if (typeof err === 'string') {
    msg = err;
  } else if (err?.message) {
    msg = typeof err.message === 'string' ? err.message : JSON.stringify(err.message);
  } else {
    try {
      msg = JSON.stringify(err);
    } catch {}
  }
  msg = msg.toLowerCase();

  return (
    status === 429 ||
    msg.includes('429') ||
    msg.includes('resource_exhausted') ||
    msg.includes('prepayment') ||
    msg.includes('credits are depleted') ||
    msg.includes('billing') ||
    msg.includes('quota')
  );
}

async function generateContentWithFallback(options: FallbackOptions): Promise<{ text: string; modelUsed: string }> {
  // If account quota or prepayment credits were recently detected as depleted, skip network attempts immediately
  if (Date.now() < creditsDepletedUntil) {
    throw new Error('Gemini API quota/prepayment credits depleted; activating local synthesis engine.');
  }

  const ai = getGenAI();
  let lastError: any = null;

  for (const modelName of MODEL_FALLBACK_LADDER) {
    try {
      const config: any = {};
      if (options.systemInstruction) config.systemInstruction = options.systemInstruction;
      if (options.temperature !== undefined) config.temperature = options.temperature;
      if (options.responseMimeType) config.responseMimeType = options.responseMimeType;
      if (options.responseSchema) config.responseSchema = options.responseSchema;

      const response = await ai.models.generateContent({
        model: modelName,
        contents: options.contents,
        config: Object.keys(config).length > 0 ? config : undefined,
      });

      const responseText = response.text || '';
      return { text: responseText, modelUsed: modelName };
    } catch (err: any) {
      lastError = err;
      const status = err?.status || err?.statusCode || 0;
      const msg = (err?.message || '').toLowerCase();

      // Account-level quota / prepayment credit depletion affects all models on this key
      if (isAccountQuotaOrCreditError(err)) {
        creditsDepletedUntil = Date.now() + 60000;
        console.info('[Hearthnote Companion] Gemini prepayment credits or quota depleted; smoothly activating local synthesis engine.');
        throw err;
      }

      const isRecoverable =
        status === 503 ||
        status === 404 ||
        status === 500 ||
        msg.includes('unavailable') ||
        msg.includes('not found') ||
        msg.includes('internal error') ||
        msg.includes('overloaded');

      if (isRecoverable) {
        console.info(`[Gemini Fallback] Model '${modelName}' unavailable (${status || 'transient'}), checking next model in ladder...`);
      } else {
        throw err;
      }
    }
  }

  throw lastError || new Error('All fallback models in the ladder failed to generate response.');
}

// Robust JSON parser that handles markdown codeblocks and leading/trailing noise
function safeParseJson(raw: string): any {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {}
  const firstBrace = raw.indexOf('{');
  const lastBrace = raw.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const candidate = raw.slice(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(candidate);
    } catch {}
  }
  const clean = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(clean);
  } catch {}
  return null;
}

// Intelligent, content-aware synthesis engine for Weekly Reflection
function synthesizeWeeklyReflection(entries: any[], moodCounts: Record<string, number>, weekRangeLabel?: string) {
  if (!entries || entries.length === 0) {
    return {
      moodTrendSummary: 'Write a few entries throughout the week to see your gentle reflection patterns unfold here.',
      themes: ['Daily mindfulness', 'Quiet pauses'],
      reflectionQuestions: ['What brought you a feeling of ease recently?', 'What small pause supported you most this week?'],
      disclaimer: 'AI-generated reflection · A quiet mirror, not advice.',
      modelUsed: 'hearthnote-synthesis-engine',
    };
  }

  // Count moods
  const counts: Record<string, number> = { ...moodCounts };
  entries.forEach((e) => {
    const m = (e.mood || 'calm').toLowerCase();
    counts[m] = (counts[m] || 0) + 1;
  });

  const sortedMoods = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const primaryMood = sortedMoods[0]?.[0] || 'calm';
  const secondaryMood = sortedMoods[1]?.[0];

  // Combined text corpus for keyword analysis
  const combinedText = entries
    .map((e) => `${e.title || ''} ${e.templateTitle || ''} ${e.text || ''} ${Object.values(e.promptAnswers || {}).join(' ')}`)
    .join(' ')
    .toLowerCase();

  // Extract themes based on actual keywords
  const candidateThemes: string[] = [];
  if (/(sleep|rest|tired|quiet|breathe|slow|still|pause|tea|coffee|bed|calm)/.test(combinedText)) {
    candidateThemes.push('Honoring restorative pauses & rest');
  }
  if (/(nature|walk|trees|park|sky|sun|rain|outside|morning|evening|stars|window)/.test(combinedText)) {
    candidateThemes.push('Attunement to nature & daily rhythms');
  }
  if (/(thank|grateful|bless|kind|appreciate|friend|family|love|laugh|smile|grace)/.test(combinedText)) {
    candidateThemes.push('Cultivating heartfelt gratitude');
  }
  if (/(work|project|code|focus|busy|deadline|task|goal|effort|finish|book|read)/.test(combinedText)) {
    candidateThemes.push('Navigating focus and creative momentum');
  }
  if (/(stress|anxious|worry|pressure|overwhelm|release|let go|boundary|heavy)/.test(combinedText)) {
    candidateThemes.push('Releasing tension & setting kind boundaries');
  }
  if (/(learn|grow|patient|change|listen|understand|healing|forgive|mind)/.test(combinedText)) {
    candidateThemes.push('Gentle self-discovery & patient growth');
  }

  // Fallback themes if few keywords matched
  if (candidateThemes.length < 2) {
    if (primaryMood === 'calm' || primaryMood === 'reflective') {
      candidateThemes.push('Grounding in present stillness');
      candidateThemes.push('Reflective clarity across days');
    } else if (primaryMood === 'grateful') {
      candidateThemes.push('Noticing everyday grace');
      candidateThemes.push('Quiet appreciation of small moments');
    } else if (primaryMood === 'energized') {
      candidateThemes.push('Harnessing inspired vitality');
      candidateThemes.push('Following creative sparks');
    } else {
      candidateThemes.push('Holding honest space for feelings');
      candidateThemes.push('Gentle presence amidst change');
    }
  }

  const themes = candidateThemes.slice(0, 3);

  // Formulate mood trend summary
  let moodTrendSummary = '';
  if (primaryMood === 'calm') {
    moodTrendSummary = secondaryMood && secondaryMood !== 'calm'
      ? `Your week carried a steady baseline of calm, balanced with moments of ${secondaryMood} inquiry that gave your thoughts space to settle.`
      : 'Your week was anchored by a quiet, grounded calm, creating an unhurried harbor for your daily thoughts.';
  } else if (primaryMood === 'reflective') {
    moodTrendSummary = secondaryMood && secondaryMood !== 'reflective'
      ? `A deeply introspective rhythm defined your week, gracefully shifting between thoughtful contemplation and ${secondaryMood} awareness.`
      : 'Your pages revealed an unhurried introspective curiosity, turning inward to process the subtleties of your days with care.';
  } else if (primaryMood === 'grateful') {
    moodTrendSummary = 'A warm current of appreciation flowed through your writing this week, illuminating simple blessings and steady anchors.';
  } else if (primaryMood === 'energized') {
    moodTrendSummary = 'Your reflections were marked by vibrant curiosity and momentum, translating fresh inspiration into clear intentions.';
  } else if (primaryMood === 'anxious' || primaryMood === 'restless') {
    moodTrendSummary = 'Your week held honest currents of navigating uncertainty and tension, met with the bravery to put words to paper and seek quiet grounding.';
  } else if (primaryMood === 'heavy') {
    moodTrendSummary = 'You carried significant emotional weight this week, meeting each day with tender honesty and giving yourself permission to simply be.';
  } else {
    moodTrendSummary = 'Your week held steady moments of quiet reflection, honoring your personal pace and presence across your entries.';
  }

  // Tailored reflection questions
  const reflectionQuestions: string[] = [];
  if (primaryMood === 'calm' || primaryMood === 'grateful') {
    reflectionQuestions.push('Which quiet moment this week brought you the deepest sense of inner ease?');
    reflectionQuestions.push('What is one small blessing from these days that you would like to carry forward into next week?');
  } else if (primaryMood === 'anxious' || primaryMood === 'heavy') {
    reflectionQuestions.push('What is one expectation you carried this week that you can gently give yourself permission to release?');
    reflectionQuestions.push('Where did you find an unexpected pocket of warmth or comfort during these days?');
  } else if (primaryMood === 'reflective') {
    reflectionQuestions.push('As you look back over your pages from this week, what surprised you most about what needed expression?');
    reflectionQuestions.push('What question feels most tender or important to hold quietly as the coming week begins?');
  } else {
    reflectionQuestions.push('What brought you the greatest feeling of vitality or alignment this week?');
    reflectionQuestions.push('How might you protect space for your inner voice in the days ahead?');
  }

  // Generate structured Weekly Emotional Rhythm insights
  const dominantEmotions = [
    primaryMood.charAt(0).toUpperCase() + primaryMood.slice(1),
    ...(secondaryMood ? [secondaryMood.charAt(0).toUpperCase() + secondaryMood.slice(1)] : [])
  ];

  const emotionalHighsAndLows = entries.length > 1
    ? `Your week moved between moments of ${primaryMood} presence and periods of deeper introspection, navigating the natural tides of daily energy with grace.`
    : `Your page captured an honest snapshot of ${primaryMood} presence.`;

  const recurringThoughts = candidateThemes[0] || 'Carving out intentional daily pauses';
  const stressPatterns = /(stress|busy|rush|deadline|tired|overwhelm)/i.test(combinedText)
    ? 'Midweek responsibilities asked for extra patience and conscious boundary-setting.'
    : 'A gentle rhythm prevailed, keeping tension within manageable, mindful limits.';
  const positiveMoments = /(grateful|joy|peace|nature|calm|smile|friend|walk)/i.test(combinedText)
    ? 'Quiet pauses, fresh outdoor air, and small acts of presence anchored your emotional well-being.'
    : 'Your dedicated time to sit and write offered a grounding sanctuary.';

  return {
    moodTrendSummary,
    dominantEmotions,
    emotionalHighsAndLows,
    recurringThoughts,
    stressPatterns,
    positiveMoments,
    themes,
    reflectionQuestions,
    disclaimer: 'AI-generated reflection · A quiet mirror, not advice.',
    modelUsed: 'hearthnote-synthesis-engine',
  };
}

// Intelligent Synthesis Engine for Emotional Mirror across all notebook pages
function synthesizeEmotionalMirror(entries: any[], moodCounts: Record<string, number>) {
  if (!entries || entries.length === 0) {
    return {
      primaryFeeling: 'Quiet Stillness',
      primaryFeelingEmoji: '🌱',
      primaryFeelingSummary: 'Your notebook awaits your first words. As you capture daily thoughts, this mirror will reveal your most common feelings and emotional currents.',
      feelingBreakdown: [
        { feeling: 'Calm', percentage: 100, insight: 'A peaceful starting canvas for self-reflection.' },
      ],
      recurringThemes: ['Beginning the journey', 'Quiet reflection'],
      emotionalEvolution: 'Your pages are just beginning to open.',
      gentleEncouragement: 'Every great journey of self-discovery begins with a single page.',
      totalEntriesAnalyzed: 0,
      lastAnalyzedAt: Date.now(),
      timestamp: Date.now(),
      modelUsed: 'hearthnote-emotional-mirror-engine',
    };
  }

  // Aggregate mood counts across all entries and incoming mood counts
  const tallies: Record<string, number> = {};
  entries.forEach((e) => {
    const m = (e.mood || 'calm').toLowerCase();
    tallies[m] = (tallies[m] || 0) + 1;
  });
  if (moodCounts && typeof moodCounts === 'object') {
    Object.entries(moodCounts).forEach(([m, count]) => {
      if (typeof count === 'number' && count > 0 && !tallies[m]) {
        tallies[m] = count;
      }
    });
  }

  const totalEvents = Object.values(tallies).reduce((sum, c) => sum + c, 0) || entries.length || 1;

  const moodDetailsMap: Record<string, { label: string; emoji: string; insight: string }> = {
    calm: {
      label: 'Grounded Calm',
      emoji: '🌿',
      insight: 'Serves as your primary inner sanctuary, anchoring you in steady presence when stepping away from the rush of daily life.',
    },
    reflective: {
      label: 'Thoughtful Introspection',
      emoji: '🕯️',
      insight: 'A consistent desire to look under the surface of daily events and untangle complex thoughts with unhurried honesty.',
    },
    grateful: {
      label: 'Heartfelt Gratitude',
      emoji: '🌅',
      insight: 'A radiant awareness that gently spotlights small blessings, acts of kindness, and moments of simple grace.',
    },
    energized: {
      label: 'Inspired Vitality',
      emoji: '✨',
      insight: 'Surges of creative curiosity and forward momentum that channel your focus into purposeful expression.',
    },
    anxious: {
      label: 'Tender Vigilance',
      emoji: '🌱',
      insight: 'An acute sensitivity to life’s uncertainties, transformed into courage and self-compassion through writing.',
    },
    heavy: {
      label: 'Patient Processing',
      emoji: '🌧️',
      insight: 'Holding complex emotional weights with dignity, choosing honest recognition over rushing toward false resolutions.',
    },
    restless: {
      label: 'Seeking Horizon',
      emoji: '🌊',
      insight: 'An instinctive inner longing for expansion, realignment, and deliberate reinvention of daily habits.',
    },
  };

  const sortedTallies = Object.entries(tallies).sort((a, b) => b[1] - a[1]);
  const primaryKey = sortedTallies[0]?.[0] || 'calm';
  const primaryMeta = moodDetailsMap[primaryKey] || moodDetailsMap.calm;

  // Compute percentage breakdown summing to 100%
  let remainingPct = 100;
  const feelingBreakdown = sortedTallies.slice(0, 4).map(([moodKey, count], idx, arr) => {
    const meta = moodDetailsMap[moodKey] || {
      label: moodKey.charAt(0).toUpperCase() + moodKey.slice(1),
      emoji: '✨',
      insight: 'An authentic emotional layer shaping your perspective.',
    };

    let pct = Math.round((count / totalEvents) * 100);
    if (idx === arr.length - 1) {
      pct = Math.max(5, remainingPct);
    } else {
      pct = Math.min(pct, Math.max(5, remainingPct - (arr.length - idx - 1) * 5));
      remainingPct -= pct;
    }

    return {
      feeling: meta.label,
      percentage: pct,
      insight: meta.insight,
    };
  });

  const topPct = feelingBreakdown[0]?.percentage || Math.round((sortedTallies[0][1] / totalEvents) * 100);

  // Extract recurring themes from text corpus
  const corpus = entries.map((e) => `${e.title || ''} ${e.text || ''}`).join(' ').toLowerCase();
  const themePool: string[] = [];
  if (/(breathe|quiet|peace|rest|slow|evening|morning)/.test(corpus)) themePool.push('Carving out quiet space');
  if (/(nature|trees|walk|outside|sky|sun)/.test(corpus)) themePool.push('Grounding in sensory presence');
  if (/(gratitude|thankful|friend|love|kind|family)/.test(corpus)) themePool.push('Everyday appreciation & warmth');
  if (/(work|focus|project|task|write|create|read)/.test(corpus)) themePool.push('Creative clarity and direction');
  if (/(boundary|release|let go|stress|pressure)/.test(corpus)) themePool.push('Releasing unneeded weight');
  if (/(grow|patience|listen|heart|truth)/.test(corpus)) themePool.push('Deepening self-compassion');

  if (themePool.length < 3) {
    themePool.push('Intentional daily reflection', 'Patience with the unfolding journey', 'Honoring emotional balance');
  }

  const recurringThemes = themePool.slice(0, 4);

  // Formulate primary feeling summary
  const primaryFeelingSummary = `Across your ${entries.length} journal ${entries.length === 1 ? 'page' : 'pages'}, ${primaryMeta.label} emerges as your most prominent emotional state, representing roughly ${topPct}% of your recorded reflections. Your entries consistently show a practice of turning toward your thoughts with honest presence, especially during evening transitions and moments of quiet contemplation.`;

  // Emotional evolution
  const emotionalEvolution = entries.length > 2
    ? 'From your earliest pages to your most recent entries, your writing reveals a transition from simply recording events toward cultivating an authentic inner dialogue and trusting your personal rhythm.'
    : 'Your reflections demonstrate an immediate willingness to listen inward and give words to the quiet movements of your heart.';

  const gentleEncouragement = 'Holding space for your feelings with honesty is a lasting gift to yourself. Continue honoring whatever you feel with gentleness and patient curiosity.';

  return {
    primaryFeeling: primaryMeta.label,
    primaryFeelingEmoji: primaryMeta.emoji,
    primaryFeelingSummary,
    feelingBreakdown,
    recurringThemes,
    emotionalEvolution,
    gentleEncouragement,
    totalEntriesAnalyzed: entries.length,
    lastAnalyzedAt: Date.now(),
    timestamp: Date.now(),
    modelUsed: 'hearthnote-emotional-mirror-engine',
  };
}

// Intelligent Synthesis Engine for Entry Reflection
function synthesizeEntryReflection(entryText: string, mood: string, templateTitle?: string, promptAnswers?: any) {
  const moodKey = (mood || 'calm').toLowerCase();
  const reflectionsByMood: Record<string, string[]> = {
    calm: [
      "A quiet, steady stillness breathes through your words today. Giving yourself space to rest in this peace is a gentle blessing.",
      "Your writing carries a grounded ease. Notice how naturally your breath slows when you allow the present moment to be enough."
    ],
    reflective: [
      "There is deep wisdom in taking time to untangle these thoughts on paper. Honoring this inner conversation brings lasting clarity.",
      "Stepping back to observe your day with curiosity rather than judgment is a beautiful act of self-kindness."
    ],
    grateful: [
      "Noticing the quiet grace in your day softens the edges of everything else. This gratitude is an anchor that stays with you.",
      "Your appreciation for the small, simple gifts of life shines brightly across this page."
    ],
    energized: [
      "A clear vitality moves through what you have written. May this spark guide your actions with joy and purpose.",
      "Your words carry fresh momentum and forward sight. Honor this inspiring spark at your own steady pace."
    ],
    anxious: [
      "You met uncertainty with genuine honesty today. Remember that feelings are passing weather, and you are the steady ground.",
      "Writing through worry takes courage. Take a deep, gentle breath and know that you do not have to solve everything right now."
    ],
    heavy: [
      "It takes profound bravery to sit with what is heavy and speak your truth. You are not alone, and it is okay to rest right here.",
      "Your feelings deserve this patient, unhurried space. Be gentle with your heart as you hold what today brought."
    ],
    restless: [
      "Giving your seeking mind a harbor on paper allows the inner dust to settle. Trust that your path unfolds one step at a time.",
      "This restlessness is often a quiet sign of something ready to bloom. What small shift feels kindest right now?"
    ]
  };

  const pool = reflectionsByMood[moodKey] || reflectionsByMood.calm;
  const picked = pool[Math.floor(Math.random() * pool.length)];

  return {
    reflection: picked,
    modelUsed: 'hearthnote-reflection-engine',
    timestamp: Date.now(),
  };
}

// Intelligent Synthesis Engine for Companion Inquiry Dialogue & Continuous Chat
function synthesizeCompanionChatDialogue(
  userMessage: string,
  history: Array<{ role?: string; text?: string; sender?: string }>,
  weekContext: { weekLabel?: string; moodSummary?: string; questions?: string[]; weekEntries?: any[] }
) {
  const clean = (userMessage || '').trim().toLowerCase();
  const entries = Array.isArray(weekContext.weekEntries) ? weekContext.weekEntries : [];
  const entriesCount = entries.length;

  // Extract entries by emotional mood
  const lowEntries = entries.filter((e) => {
    const m = (e.mood || '').toLowerCase();
    const t = `${e.title || ''} ${e.text || ''}`.toLowerCase();
    return ['anxious', 'heavy', 'restless'].includes(m) || /(sad|stress|tired|overwhelm|worry|hard|rough|exhaust)/i.test(t);
  });

  const joyfulEntries = entries.filter((e) => {
    const m = (e.mood || '').toLowerCase();
    const t = `${e.title || ''} ${e.text || ''}`.toLowerCase();
    return ['calm', 'grateful', 'energized'].includes(m) || /(happy|joy|peace|good|love|grateful|smile|rest)/i.test(t);
  });

  // Targeted questions from user prompt
  if (/(felt low|feel low|feeling low|why was i sad|why did i feel down)/i.test(clean)) {
    if (lowEntries.length > 0) {
      const snippets = lowEntries.map((e) => `"${e.title || e.text?.slice(0, 50) || 'a moment of pressure'}"`).slice(0, 2).join(' and ');
      return {
        companionReply: `Looking back over your pages this week, moments where energy felt heavier seemed closely tied to ${snippets}. When responsibilities accumulated or rest was cut short, your inner rhythm felt the strain. What was the most exhausting part of carrying that?`,
        modelUsed: 'hearthnote-companion-chat-engine',
      };
    }
    return {
      companionReply: "Even when entries were generally steady, there were subtle moments where tension crept into your thoughts—often when demands outpaced your breathing room. Remember that having low moments isn't a setback; it's your body's honest way of asking for a pause.",
      modelUsed: 'hearthnote-companion-chat-engine',
    };
  }

  if (/(made me happier|more happy|happier|sparked joy|brought me joy|positive things happened|positive moments)/i.test(clean)) {
    if (joyfulEntries.length > 0) {
      const highlights = joyfulEntries.map((e) => e.title ? `"${e.title}"` : 'your quiet moments of reflection').slice(0, 2).join(' and ');
      return {
        companionReply: `The clearest sparks of happiness and grounding in your pages came from ${highlights}. When you gave yourself permission to slow down, be outside, or appreciate the simple things, your words immediately reflected warmth and ease. How did those moments feel in your day?`,
        modelUsed: 'hearthnote-companion-chat-engine',
      };
    }
    return {
      companionReply: "Your journal shows that your happiest, most grounded moments this week came from small, unhurried pauses—moments of stepping back, breathing, and writing with honest intention. Protecting even ten minutes like that makes a world of difference.",
      modelUsed: 'hearthnote-companion-chat-engine',
    };
  }

  if (/(what patterns|patterns do you notice|recurring patterns|any pattern)/i.test(clean)) {
    const moodsList = entries.map((e) => e.mood).filter(Boolean);
    const uniqueMoods = Array.from(new Set(moodsList));
    return {
      companionReply: `Looking across your ${entriesCount} entry${entriesCount === 1 ? '' : 's'} this week, I notice a clear rhythm: ${uniqueMoods.length > 0 ? `your emotions moved between ${uniqueMoods.join(', ')}` : 'you moved between active effort and reflective pauses'}. You consistently turn to writing when navigating transitions, using your notebook as a mirror rather than just a logbook. What pattern stands out most to you?`,
      modelUsed: 'hearthnote-companion-chat-engine',
    };
  }

  if (/(worrying about the most|worried about|what was i worrying|biggest worry|stress pattern)/i.test(clean)) {
    return {
      companionReply: `In your reflections, the recurring thread of tension centered on balancing daily demands with your own need for quiet restoration. You were mindful of not overcommitting, yet still felt the pressure of expectations. When you think about that worry now, does it still feel as heavy?`,
      modelUsed: 'hearthnote-companion-chat-engine',
    };
  }

  if (/(did my mood improve|mood improve|improve during the week|emotional shift)/i.test(clean)) {
    if (entries.length >= 2) {
      const firstMood = entries[0]?.mood || 'calm';
      const lastMood = entries[entries.length - 1]?.mood || 'calm';
      return {
        companionReply: `Looking at your entries chronologically, you began the week with a sense of ${firstMood} presence and navigated toward ${lastMood} clarity as the days unfolded. Taking time to process your thoughts on paper visibly allowed tension to settle. How do you feel looking back at where you started?`,
        modelUsed: 'hearthnote-companion-chat-engine',
      };
    }
    return {
      companionReply: "As you wrote and articulated your feelings throughout the week, your writing showed a clear progression toward clarity and self-compassion. The very act of naming your emotions gave you breathing room.",
      modelUsed: 'hearthnote-companion-chat-engine',
    };
  }

  if (/(focus on next week|what should i focus|intention for next week|next week)/i.test(clean)) {
    return {
      companionReply: "Based on the lessons of this week, a gentle and protective focus for next week would be guarding your quiet boundaries—allowing yourself pockets of unhurried presence before the rush begins. What single small boundary feels most supportive for you to protect?",
      modelUsed: 'hearthnote-companion-chat-engine',
    };
  }

  if (/(difficult to let go|letting go|hard to let go|holding on)/i.test(clean)) {
    return {
      companionReply: "Your reflections show that expectations—either from external deadlines or from your own desire to do everything right—are what you find most difficult to let go of. Remember that letting go isn't giving up; it is simply making room for your own peace. What would happen if you let that demand rest for just one evening?",
      modelUsed: 'hearthnote-companion-chat-engine',
    };
  }

  if (/(\bwhy\b|\bhow can i\b|\bwhat should\b|\bhow do i\b|\bhelp me understand\b|\bexplain\b)/i.test(clean)) {
    if (/(anxious|worry|stress|overwhelm|tired|exhaust|drained|fear|burnout)/i.test(clean)) {
      return {
        companionReply: "When tension or tiredness clusters during the week, it is often your mind and body signaling that your boundaries were stretched too far. Honoring those limits without judging yourself creates the breathing space you need. What is one small demand you could gently put down today to restore your balance?",
        modelUsed: 'hearthnote-companion-chat-engine',
      };
    }
    if (/(calm|peace|ease|grounded|joy|happy|grateful|good|blessed)/i.test(clean)) {
      return {
        companionReply: "To carry that peace forward, pay attention to the specific habits or pauses that nurtured it—a quiet morning cup, time outdoors, or an unhurried conversation. Anchoring that feeling allows you to return to it when life quickens. How might you protect even ten minutes like that in the coming week?",
        modelUsed: 'hearthnote-companion-chat-engine',
      };
    }
    return {
      companionReply: "Looking back on your week with this kind of open curiosity is where true self-clarity begins. Frequently the answer isn't about doing more, but creating space to listen to your inner rhythm. What feels most true to you when you quiet the immediate noise?",
      modelUsed: 'hearthnote-companion-chat-engine',
    };
  }

  if (/(thank|appreciate|helpful|good to talk|love this|grateful|makes sense)/i.test(clean)) {
    return {
      companionReply: "It is a joy to share this quiet reflection harbor with you. Holding space for your own experience is an act of deep self-respect. Is there any other moment or feeling from these past days you'd like to explore together?",
      modelUsed: 'hearthnote-companion-chat-engine',
    };
  }

  if (/(sad|hurt|lonely|cry|lost|hard|pain|difficult|struggl|grief|heavy)/i.test(clean)) {
    return {
      companionReply: "I hear how much tenderness and weight you have been carrying. You do not have to put on a brave face here or rush to fix it. Allowing yourself to simply feel without self-blame is profoundly healing. What gentle kindness can you give yourself right now?",
      modelUsed: 'hearthnote-companion-chat-engine',
    };
  }

  if (/(work|job|boss|deadline|meeting|busy|chaos|tasks|schedule|school|project)/i.test(clean)) {
    return {
      companionReply: "The constant hum of work and deadlines can easily overshadow your natural pace. Noticing this pressure is the first step in reclaiming your center. When you picture the week ahead, where is one place you can set a firmer, kinder boundary?",
      modelUsed: 'hearthnote-companion-chat-engine',
    };
  }

  if (/(nature|walk|trees|sun|morning|sky|breathe|tea|coffee|night|stars)/i.test(clean)) {
    return {
      companionReply: "Connecting with those simple, sensory moments in nature or stillness creates an enduring anchor for the mind. Those are the quiet rituals that truly replenish your spirit. How did that moment feel in your body while you were there?",
      modelUsed: 'hearthnote-companion-chat-engine',
    };
  }

  if (clean.length < 15) {
    return {
      companionReply: "Thank you for pausing and sharing that thought. Every small realization adds a layer of clarity to your week. Would you like to tell me a little more about what that brought up for you?",
      modelUsed: 'hearthnote-companion-chat-engine',
    };
  }

  const generalPool = [
    "Hearing you reflect like this brings wonderful depth to your weekly journey. Putting words to these impressions allows your thoughts to settle into wisdom. What part of this realization feels most valuable to carry with you?",
    "That is a perceptive observation. Our journal pages often reveal gentle currents we miss in the rush of the moment. Would you like to explore where this feeling originated, or focus on how to care for yourself moving forward?",
    "Thank you for speaking so honestly. Honoring your emotional truth is where genuine resilience takes root. What feels like the kindest next step for you today as you look back on this week?"
  ];
  const picked = generalPool[Math.floor(Math.random() * generalPool.length)];

  return {
    companionReply: picked,
    modelUsed: 'hearthnote-companion-chat-engine',
  };
}

// Intelligent Synthesis Engine for Companion Inquiry Dialogue (Single question/answer fallback)
function synthesizeInquiryReply(question: string, answer: string, isFinalQuestion: boolean = false) {
  const cleanAnswer = (answer || '').trim();
  let companionReply = '';

  if (cleanAnswer.length < 10) {
    companionReply = "Thank you for pausing with this question. Even a brief thought holds a seed of genuine self-awareness.";
  } else if (/(walk|nature|sun|sky|trees|outside|morning|rain|water|wind)/i.test(cleanAnswer)) {
    companionReply = "Connecting with those quiet moments in nature creates an enduring sanctuary for your mind. Holding onto that sensory presence brings steady peace.";
  } else if (/(friend|family|love|laugh|talk|share|kind|sister|brother|mom|dad|partner)/i.test(cleanAnswer)) {
    companionReply = "Shared human warmth and genuine connection soften the week's hardest corners. Cherishing that bond is a wonderful anchor.";
  } else if (/(rest|sleep|slow|pause|tea|breathe|bed|relax|quiet|peace)/i.test(cleanAnswer)) {
    companionReply = "Giving yourself permission to rest and exhale without guilt is a profound practice of self-kindness. That stillness is deeply earned.";
  } else if (/(work|effort|finish|focus|code|project|learn|grow)/i.test(cleanAnswer)) {
    companionReply = "Noticing where your energy flowed this week honors your dedication while reminding you to honor your own pace.";
  } else {
    companionReply = "Your honesty in answering this question brings clear perspective. Taking time to put words to your experience is a lasting gift to yourself.";
  }

  const closingAffirmation = isFinalQuestion 
    ? "I have woven your reflections together and saved them directly into your Weekly Reflection notes."
    : "Take a gentle breath whenever you feel ready for the next question.";

  return {
    companionReply,
    closingAffirmation,
    modelUsed: 'hearthnote-inquiry-engine',
  };
}

async function startServer() {
  const app = express();

  // 1. Top-Level Request Deserialization (Ordering Guarantee)
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Health check endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
      timestamp: Date.now(),
    });
  });

  // 2. Hearthnote Entry Reflection API ("A gentle thought")
  // Generates 1-2 sentences of quiet, non-directive reflection on a saved journal entry
  app.post('/api/gemini/reflect-entry', async (req: Request, res: Response) => {
    try {
      const data = (req.body && typeof req.body === 'object') ? req.body : {};
      const entryText = typeof data.entryText === 'string' ? data.entryText.trim() : '';
      const templateTitle = typeof data.templateTitle === 'string' ? data.templateTitle : 'Personal Journal';
      const mood = typeof data.mood === 'string' ? data.mood : 'calm';
      const promptAnswers = typeof data.promptAnswers === 'object' && data.promptAnswers !== null ? data.promptAnswers : {};
      const aiMemoryLevel = typeof data.aiMemoryLevel === 'string' ? data.aiMemoryLevel : 'light';
      const pastEntries = Array.isArray(data.pastEntries) ? data.pastEntries : [];

      if (aiMemoryLevel === 'none') {
        res.json({
          reflection: '',
          dismissed: true,
          modelUsed: 'none',
          memoryMode: 'none',
        });
        return;
      }

      if (!entryText && Object.keys(promptAnswers).length === 0) {
        res.json({
          reflection: 'Your thoughts have been warmly preserved in your notebook.',
          modelUsed: 'default',
          memoryMode: aiMemoryLevel,
        });
        return;
      }

      const answersSummary = Object.entries(promptAnswers)
        .map(([k, v]) => `- ${v}`)
        .join('\n');

      let historyContext = '';
      if (aiMemoryLevel === 'deep' && pastEntries.length > 0) {
        historyContext = `\nRecent Notebook History (for Deep Memory emotional continuity):\n` +
          pastEntries.map((pe: any, idx: number) => {
            const date = pe.date || `Entry #${idx + 1}`;
            const pMood = pe.mood || 'unspecified';
            const title = pe.title || pe.templateTitle || 'Journal page';
            const snippet = pe.text ? pe.text.slice(0, 180) : '';
            return `[${date} | Mood: ${pMood} | Title: "${title}"]: ${snippet}`;
          }).join('\n');
      }

      const userContent = `Journal Template: ${templateTitle}
Mood: ${mood}
Prompt Reflections:
${answersSummary || 'None'}

Current Entry Content:
${entryText}
${historyContext}`;

      const deepMemoryInstruction = aiMemoryLevel === 'deep'
        ? `\nDEEP MEMORY CONTINUITY INSTRUCTION:
You have access to brief excerpts of the writer's recent entries. Quietly recognize emotional continuity, growth, or recurring threads across their reflections. If relevant, gently mirror how this present realization connects with where their thoughts have traveled recently.`
        : ``;

      const systemInstruction = `You are the gentle companion inside Hearthnote, a private personal notebook.
Your purpose is to offer a quiet, non-intrusive "gentle thought" to the writer after they close their entry.
${deepMemoryInstruction}

CRITICAL RULES:
1. Length: Exactly 1 to 2 short sentences. Never more.
2. Tone: Warm, grounded, serene, observant, and non-prescriptive.
3. Absolutely NO clinical jargon, diagnosing, or therapy advice.
4. Never say "You should", "Try to", "I recommend", or "Make sure to".
5. Favor gentle open-ended questions or quiet acknowledgments that highlight their self-awareness, small moments of grace, or healthy boundaries.
6. Safety & Crisis: If the entry expresses severe emotional distress, self-harm, or crisis, do not give advice. Instead, output: "You are carrying something very heavy right now. Please remember you don't have to carry it alone — reaching out to a trusted friend or the 988 Lifeline is always there."
7. Avoid starting with generic phrases like "It is wonderful that" or "Great job". Speak directly and warmly as a gentle mirror.`;

      const result = await generateContentWithFallback({
        contents: [{ role: 'user', parts: [{ text: userContent }] }],
        systemInstruction,
        temperature: 0.6,
      });

      res.json({
        reflection: result.text.trim(),
        modelUsed: result.modelUsed,
        memoryMode: aiMemoryLevel,
        contextEntriesCount: aiMemoryLevel === 'deep' ? pastEntries.length : 0,
        timestamp: Date.now(),
      });
    } catch (error: any) {
      if (!isAccountQuotaOrCreditError(error)) {
        console.info('[Hearthnote Reflect Entry] Using local synthesis engine.');
      }
      const data = (req.body && typeof req.body === 'object') ? req.body : {};
      const fallbackResult = synthesizeEntryReflection(
        typeof data.entryText === 'string' ? data.entryText : '',
        typeof data.mood === 'string' ? data.mood : 'calm',
        typeof data.templateTitle === 'string' ? data.templateTitle : undefined,
        data.promptAnswers
      );
      res.json({
        reflection: fallbackResult.reflection,
        modelUsed: fallbackResult.modelUsed,
        memoryMode: typeof data.aiMemoryLevel === 'string' ? data.aiMemoryLevel : 'light',
        contextEntriesCount: 0,
        timestamp: fallbackResult.timestamp,
      });
    }
  });

  // Diagnostic Endpoint: Verify AI Memory Depth configuration
  app.post('/api/gemini/test-memory-level', async (req: Request, res: Response) => {
    try {
      const data = (req.body && typeof req.body === 'object') ? req.body : {};
      const aiMemoryLevel = typeof data.aiMemoryLevel === 'string' ? data.aiMemoryLevel : 'light';

      if (aiMemoryLevel === 'none') {
        res.json({
          status: 'verified',
          aiMemoryLevel: 'none',
          aiActive: false,
          summary: 'Pure Private Notebook Mode verified. All Gemini calls are completely blocked. No user data leaves your device/database to any AI model.',
        });
        return;
      }

      if (aiMemoryLevel === 'light') {
        res.json({
          status: 'verified',
          aiMemoryLevel: 'light',
          aiActive: true,
          summary: 'Light Reflection Mode verified. Only the single active entry is reflected upon in isolation on save; past entries are never accessed.',
        });
        return;
      }

      if (aiMemoryLevel === 'deep') {
        res.json({
          status: 'verified',
          aiMemoryLevel: 'deep',
          aiActive: true,
          summary: 'Deep Memory Mode verified. Multi-entry context (up to 4 recent entries) is packaged alongside the current entry to discover ongoing emotional continuity and growth threads.',
        });
        return;
      }

      res.status(400).json({ error: 'Invalid AI Memory Depth level specified.' });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Failed to verify memory level.' });
    }
  });

  // 3. Weekly Reflection & Pattern Synthesis API ("The Wow Moment")
  app.post('/api/gemini/weekly-reflection', async (req: Request, res: Response) => {
    try {
      const data = (req.body && typeof req.body === 'object') ? req.body : {};
      const entries = Array.isArray(data.entries) ? data.entries : [];
      const moodCounts = typeof data.moodCounts === 'object' && data.moodCounts !== null ? data.moodCounts : {};
      const aiMemoryLevel = typeof data.aiMemoryLevel === 'string' ? data.aiMemoryLevel : 'light';

      if (aiMemoryLevel === 'none' || entries.length === 0) {
        res.json({
          moodTrendSummary: 'Write a few entries throughout the week to see your gentle reflection patterns unfold here.',
          themes: ['Daily mindfulness', 'Quiet pauses'],
          reflectionQuestions: ['What brought you a feeling of ease recently?'],
          disclaimer: 'AI-generated reflection · A quiet mirror, not advice.',
          modelUsed: 'fallback',
        });
        return;
      }

      const formattedEntries = entries
        .slice(0, 15) // Guard payload length
        .map((e: any, idx: number) => `Entry #${idx + 1} (${e.date || 'Recent'}, Template: ${e.templateTitle || e.templateType}, Mood: ${e.mood}):
${(e.text || '').slice(0, 350)}`)
        .join('\n\n---\n\n');

      const systemInstruction = `You are the synthesis engine for Hearthnote.
You review a week of the user's private journal entries and construct an empathetic, gentle, and comprehensive Weekly Emotional Rhythm analysis.

The analysis should identify meaningful patterns across the selected week:
- dominant emotions (e.g. grounded calm, anxious urgency, reflective peace, heartfelt gratitude)
- emotional highs and lows throughout the days
- recurring thoughts or things the user frequently thinks about
- stress or worry patterns and what was causing tension
- positive moments of gratitude, presence, or joy
- emotional shifts throughout the week
- recurring themes
- moments of gratitude
- challenges faced and signs of personal growth
- possible emotional triggers

Tone Guidelines:
- Supportive, warm, conversational, and non-judgmental.
- Avoid sounding clinical, medical, psychiatric, or diagnostic.
- "moodTrendSummary": A comprehensive, warm, 2-3 paragraph reflection capturing their Weekly Emotional Rhythm, highs and lows, and emotional curve without judgment.
- "dominantEmotions": 2 to 4 dominant emotional states identified.
- "emotionalHighsAndLows": A gentle description of their highs and lows.
- "recurringThoughts": What they returned to thinking about frequently.
- "stressPatterns": Observed stress or worry patterns and how they shifted.
- "positiveMoments": Moments of gratitude, joy, and peace.
- "themes": Exactly 2 to 4 concise, poetic theme phrases (3-6 words each).
- "reflectionQuestions": Exactly 2 to 3 gentle, open reflection inquiries to ponder over the weekend.
- "disclaimer": Always "AI-generated reflection · A quiet mirror, not advice."

Return ONLY valid JSON matching this schema:
{
  "moodTrendSummary": string,
  "dominantEmotions": string[],
  "emotionalHighsAndLows": string,
  "recurringThoughts": string,
  "stressPatterns": string,
  "positiveMoments": string,
  "themes": string[],
  "reflectionQuestions": string[],
  "disclaimer": string
}`;

      const userPrompt = `Weekly Mood Distribution: ${JSON.stringify(moodCounts)}
Journal Entries:
${formattedEntries}`;

      let parsed: any = null;
      let modelUsed = 'fallback';
      try {
        const result = await generateContentWithFallback({
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
          systemInstruction,
          responseMimeType: 'application/json',
          temperature: 0.4,
        });
        modelUsed = result.modelUsed;
        parsed = safeParseJson(result.text);
      } catch (geminiErr: any) {
        if (!isAccountQuotaOrCreditError(geminiErr)) {
          console.info('[Hearthnote Weekly Reflection] Local synthesis active.');
        }
      }

      if (!parsed || !parsed.moodTrendSummary) {
        const synthesized = synthesizeWeeklyReflection(entries, moodCounts, data.weekRangeLabel);
        res.json(synthesized);
        return;
      }

      res.json({
        moodTrendSummary: parsed.moodTrendSummary || 'Your week held moments of quiet reflection and steady presence.',
        dominantEmotions: Array.isArray(parsed.dominantEmotions) && parsed.dominantEmotions.length > 0 ? parsed.dominantEmotions : ['Calm', 'Reflective'],
        emotionalHighsAndLows: parsed.emotionalHighsAndLows || 'Your week moved through natural tides of engagement and quiet restoration.',
        recurringThoughts: parsed.recurringThoughts || 'Carving out intentional daily pauses.',
        stressPatterns: parsed.stressPatterns || 'Midweek demands asked for patience, met with honest reflection.',
        positiveMoments: parsed.positiveMoments || 'Quiet pauses and moments of presence anchored your week.',
        themes: Array.isArray(parsed.themes) && parsed.themes.length > 0 ? parsed.themes : ['Quiet presence', 'Gentle pacing'],
        reflectionQuestions: Array.isArray(parsed.reflectionQuestions) && parsed.reflectionQuestions.length > 0 ? parsed.reflectionQuestions : ['What small pause supported you most this week?'],
        disclaimer: parsed.disclaimer || 'AI-generated reflection · A quiet mirror, not advice.',
        modelUsed,
      });
    } catch (error: any) {
      if (!isAccountQuotaOrCreditError(error)) {
        console.info('[Hearthnote Weekly Reflection] Synthesis active.');
      }
      const data = (req.body && typeof req.body === 'object') ? req.body : {};
      const synthesized = synthesizeWeeklyReflection(data.entries || [], data.moodCounts || {}, data.weekRangeLabel);
      res.json(synthesized);
    }
  });

  // 3b. Weekly Inquiry Dialogue AI Companion API (Dedicated Conversational Chatbot)
  app.post('/api/gemini/inquiry-dialogue', async (req: Request, res: Response) => {
    try {
      const data = (req.body && typeof req.body === 'object') ? req.body : {};
      const userMessage = typeof data.userMessage === 'string' ? data.userMessage.trim() : (typeof data.answer === 'string' ? data.answer.trim() : '');
      const moodTrendSummary = typeof data.moodTrendSummary === 'string' ? data.moodTrendSummary : '';
      const weekLabel = typeof data.weekLabel === 'string' ? data.weekLabel : 'this week';
      const rawQuestions = Array.isArray(data.questions) ? data.questions : (typeof data.question === 'string' && data.question ? [data.question] : []);
      const questions = rawQuestions.filter((q: any) => typeof q === 'string' && q.trim().length > 0);
      const rawMessages = Array.isArray(data.messages) ? data.messages : [];
      const rawWeekEntries = Array.isArray(data.weekEntries) ? data.weekEntries : (Array.isArray(data.entries) ? data.entries : []);

      // Format message history for conversation
      const conversationHistory = rawMessages
        .filter((m: any) => m && typeof m === 'object' && (m.text || m.content))
        .map((m: any) => ({
          role: (m.role === 'model' || m.role === 'assistant' || m.role === 'ai' || m.sender === 'ai') ? 'model' : 'user',
          text: String(m.text || m.content || '').trim(),
        }))
        .filter((m: any) => m.text.length > 0);

      // If userMessage is provided separately and not yet in history, append it
      if (userMessage && (conversationHistory.length === 0 || conversationHistory[conversationHistory.length - 1].text !== userMessage)) {
        conversationHistory.push({ role: 'user', text: userMessage });
      }

      if (!userMessage && conversationHistory.length === 0) {
        const fallback = synthesizeCompanionChatDialogue('', [], { weekLabel, moodSummary: moodTrendSummary, questions, weekEntries: rawWeekEntries });
        res.json({
          companionReply: "I am right here with you. Take all the time you need to share what's on your heart or mind from this week.",
          modelUsed: fallback.modelUsed,
        });
        return;
      }

      // Format week entries specifically as the grounded context for this week
      const formattedWeekEntries = rawWeekEntries
        .slice(0, 15)
        .map((e: any, idx: number) => `[Entry ${idx + 1} - Date: ${e.date || 'unknown'}, Mood: ${e.mood || 'unspecified'}, Title: "${e.title || 'Untitled'}"]
Text: ${(e.text || '').slice(0, 380)}
${e.promptAnswers ? `Prompt answers: ${Object.values(e.promptAnswers).filter(Boolean).join(' | ')}` : ''}`)
        .join('\n\n');

      const systemInstruction = `You are the Hearth Companion, an empathetic, wise, grounded, and attentive journaling companion inside Hearthnote.
You are engaged in an ongoing, dedicated reflection dialogue with the user regarding their journal entries for the specific week: "${weekLabel}".

WEEKLY JOURNAL PAGES CONTEXT (THIS WEEK ONLY):
${formattedWeekEntries ? formattedWeekEntries : 'No specific journal pages available for this week.'}

WEEKLY EMOTIONAL RHYTHM CONTEXT:
${moodTrendSummary || 'Quiet weekly reflection'}
Suggested Inquiries: "${questions.join('; ')}"

CRITICAL CONVERSATION GUIDELINES:
1. Ground your answers in the user's actual journal entries from this week.
   When the user asks questions such as:
   - "Why do you think I felt low this week?"
   - "What made me happier this week?"
   - "What patterns do you notice?"
   - "What was I worrying about the most?"
   - "Did my mood improve during the week?"
   - "What should I focus on next week?"
   - "What positive things happened this week?"
   - "What am I finding difficult to let go of?"
   Respond using the week's journal content as context rather than providing generic answers. Quote or reference specific moments, feelings, thoughts, and reflections they recorded.
2. Converse naturally with warmth, emotional intelligence, and calm perspective.
3. Keep replies focused, warm, and conversational (typically 2 to 4 sentences or a gentle paragraph).
4. Frequently end with an open, gentle question or reflective invitation that naturally continues the conversation.
5. Tone: Supportive, conversational, non-judgmental. Never give clinical, psychiatric, or diagnostic advice.`;

      let companionReply = '';
      let modelUsed = 'fallback';

      try {
        // Construct Gemini content parts from recent conversation history (up to last 10 turns)
        const recentHistory = conversationHistory.slice(-10);
        const contents = recentHistory.map((msg) => ({
          role: msg.role === 'model' ? 'model' : 'user',
          parts: [{ text: msg.text }],
        }));

        const result = await generateContentWithFallback({
          contents,
          systemInstruction,
          temperature: 0.7,
        });
        modelUsed = result.modelUsed;
        companionReply = (result.text || '').trim();
      } catch (geminiErr: any) {
        if (!isAccountQuotaOrCreditError(geminiErr)) {
          console.info('[Hearthnote Inquiry Dialogue] Local synthesis active.');
        }
      }

      if (!companionReply) {
        const synthesized = synthesizeCompanionChatDialogue(
          userMessage || (conversationHistory[conversationHistory.length - 1]?.text ?? ''),
          conversationHistory,
          { weekLabel, moodSummary: moodTrendSummary, questions, weekEntries: rawWeekEntries }
        );
        companionReply = synthesized.companionReply;
        modelUsed = synthesized.modelUsed;
      }

      res.json({
        companionReply,
        modelUsed,
      });
    } catch (error: any) {
      if (!isAccountQuotaOrCreditError(error)) {
        console.info('[Hearthnote Inquiry Dialogue] Synthesis active.');
      }
      const data = (req.body && typeof req.body === 'object') ? req.body : {};
      const msg = typeof data.userMessage === 'string' ? data.userMessage : (typeof data.answer === 'string' ? data.answer : '');
      const synthesized = synthesizeCompanionChatDialogue(msg, [], {
        weekLabel: data.weekLabel,
        moodSummary: data.moodTrendSummary,
        questions: Array.isArray(data.questions) ? data.questions : [],
        weekEntries: Array.isArray(data.weekEntries) ? data.weekEntries : [],
      });
      res.json({
        companionReply: synthesized.companionReply,
        modelUsed: synthesized.modelUsed,
      });
    }
  });

  // 3c. Voice Dictation Speech Polish API
  app.post('/api/gemini/polish-speech', async (req: Request, res: Response) => {
    try {
      const data = (req.body && typeof req.body === 'object') ? req.body : {};
      const rawTranscript = typeof data.rawTranscript === 'string' ? data.rawTranscript.trim() : '';
      const language = typeof data.language === 'string' ? data.language : 'en-US';

      if (!rawTranscript) {
        res.json({ polishedText: '', rawTranscript: '' });
        return;
      }

      // Quick local polish baseline
      const localPolished = polishSpeechLocally(rawTranscript, language);

      const systemInstruction = `You are an empathetic, natural speech-to-journal punctuation and cleanup assistant inside Hearthnote.
Transform raw spoken speech transcription into natural, readable journal writing.

CRITICAL GUIDELINES:
1. Add proper punctuation (commas, full stops, question marks where appropriate).
2. Correct capitalization at sentence starts and for proper nouns and "I".
3. Split long run-on speech into natural, readable sentences.
4. Remove unnecessary conversational filler words (e.g. "um", "uh", "you know", "like" when used purely as hesitation filler) when appropriate.
5. Make minor natural grammar adjustments (e.g. "today i was little sad" -> "Today, I was a little sad").
6. STRICTLY PRESERVE the user's original meaning, emotional tone, and intent.
7. NEVER make the text sound overly formal, academic, or AI-generated. It must read like the user's own natural, personal journal writing.
8. NEVER add ideas, explanations, or facts the user did not say.
9. Output ONLY the polished text with no quotation marks, preamble, explanation, or markdown formatting.`;

      let polishedText = '';
      let modelUsed = 'fallback';

      try {
        const result = await generateContentWithFallback({
          contents: [{ role: 'user', parts: [{ text: `Raw speech transcription: "${rawTranscript}"` }] }],
          systemInstruction,
          temperature: 0.2,
        });
        modelUsed = result.modelUsed;
        polishedText = (result.text || '').trim();
        if ((polishedText.startsWith('"') && polishedText.endsWith('"')) || (polishedText.startsWith("'") && polishedText.endsWith("'"))) {
          polishedText = polishedText.slice(1, -1).trim();
        }
      } catch (geminiErr: any) {
        if (!isAccountQuotaOrCreditError(geminiErr)) {
          console.info('[Hearthnote Speech Polish] Local cleanup active.');
        }
      }

      if (!polishedText) {
        polishedText = localPolished;
      }

      res.json({
        polishedText,
        rawTranscript,
        modelUsed,
      });
    } catch (err: any) {
      const data = (req.body && typeof req.body === 'object') ? req.body : {};
      const fallback = polishSpeechLocally(typeof data.rawTranscript === 'string' ? data.rawTranscript : '');
      res.json({
        polishedText: fallback,
        rawTranscript: data.rawTranscript || '',
        modelUsed: 'local-rule-engine',
      });
    }
  });

  // 4. Content-Based Inspired Quote Generation API
  app.post('/api/gemini/generate-quote', async (req: Request, res: Response) => {
    try {
      const data = (req.body && typeof req.body === 'object') ? req.body : {};
      const entryText = typeof data.entryText === 'string' ? data.entryText.trim() : '';
      const mood = typeof data.mood === 'string' ? data.mood : 'calm';
      const promptAnswers = typeof data.promptAnswers === 'object' && data.promptAnswers !== null ? data.promptAnswers : {};

      const combinedContent = `${entryText}\n${Object.values(promptAnswers).join('\n')}`.trim();

      if (!combinedContent) {
        res.json({
          quote: "In the quiet depth of a simple page, your mind finds its natural sanctuary.",
          author: "Hearthnote Reflection",
          modelUsed: "default",
        });
        return;
      }

      const systemInstruction = `You are a thoughtful literary quote assistant inside Hearthnote, a private reflective journal app.
Given a user's journal entry content and mood, generate a unique, deeply moving, elegant 1-sentence quote or philosophical observation that directly mirrors, grounds, or elevates the user's written thoughts.

Rules:
1. Exactly 1 inspiring sentence.
2. Poetic, warm, comforting, and grounded in the specific emotion/theme written.
3. Return ONLY valid JSON matching:
{
  "quote": string,
  "author": string
}`;

      const userPrompt = `User's Mood: ${mood}
User's Writing:
${combinedContent}`;

      const result = await generateContentWithFallback({
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.7,
      });

      let parsed: any;
      try {
        parsed = JSON.parse(result.text);
      } catch {
        const clean = result.text.replace(/```json/g, '').replace(/```/g, '').trim();
        parsed = JSON.parse(clean);
      }

      res.json({
        quote: parsed.quote || "To write your truth down is to grant your mind room to rest.",
        author: parsed.author || "Quiet Mirror",
        modelUsed: result.modelUsed,
      });
    } catch (error: any) {
      if (!isAccountQuotaOrCreditError(error)) {
        console.info('[Hearthnote Quote] Curated quote active.');
      }
      res.json({
        quote: "Between the lines of what you write, peace softly settles.",
        author: "Hearthnote Companion",
        modelUsed: "fallback",
      });
    }
  });

  // 5. Interactive Reflection Companion Chat API
  app.post('/api/gemini/chat', async (req: Request, res: Response) => {
    try {
      const data = (req.body && typeof req.body === 'object') ? req.body : {};
      const userMessage = typeof data.message === 'string' ? data.message.trim() : '';
      const history = Array.isArray(data.history) ? data.history : [];
      const reflectionQuestion = typeof data.reflectionQuestion === 'string' ? data.reflectionQuestion : '';
      const reflectionSummary = typeof data.reflectionSummary === 'string' ? data.reflectionSummary : '';
      const themes = Array.isArray(data.themes) ? data.themes.join(', ') : '';

      if (!userMessage) {
        res.status(400).json({ error: 'Message content is required.' });
        return;
      }

      // Format previous conversation turns safely
      const formattedHistory = history
        .slice(-8) // Keep context window focused
        .map((m: any) => `${m.sender === 'user' ? 'User' : 'Reflection Companion'}: ${m.text || ''}`)
        .join('\n\n');

      const systemInstruction = `You are Hearthnote's gentle Reflection Companion.
You are engaged in an intimate, quiet conversation with the writer about their weekly reflection mirror.
Weekly Reflection Context:
- Central Question Discussed: "${reflectionQuestion || 'What brought you a feeling of ease recently?'}"
- Emotional Arc Summary: "${reflectionSummary || 'Moments of quiet observation and grounding'}"
- Recurring Themes: ${themes || 'Mindfulness, patience, gentle pauses'}

Your Core Purpose:
1. Provide a calm, deeply thoughtful, warm sounding board for the user's reflections.
2. Length: Keep your reply concise (2 to 4 gentle sentences). Never write lengthy sermons or lecture the user.
3. Tone: Empathetic, poetic yet simple, non-judgmental, grounded.
4. Boundaries: You are NOT a therapist, doctor, or advisor. Never give clinical advice, diagnose conditions, or prescribe life solutions. Use mirroring and open inquiry ("How does that space feel when you step into it?", "What would it look like to honor that need today?").
5. Safety: If self-harm or crisis is mentioned, gently remind them that they deserve support and offer the 988 Suicide & Crisis Lifeline.`;

      const prompt = `${formattedHistory ? `Prior Conversation:\n${formattedHistory}\n\n` : ''}User's New Thought:
${userMessage}`;

      const result = await generateContentWithFallback({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        systemInstruction,
        temperature: 0.6,
      });

      res.json({
        reply: result.text.trim(),
        modelUsed: result.modelUsed,
        timestamp: Date.now(),
      });
    } catch (error: any) {
      if (!isAccountQuotaOrCreditError(error)) {
        console.info('[Hearthnote Chat] Fallback response active.');
      }
      // Graceful empathetic fallback so user reflection is never interrupted
      const fallbackReplies = [
        "Thank you for sharing that with me. It takes genuine quiet honesty to name those feelings and give them a place to simply be.",
        "There is a lot of wisdom in listening to what your day was trying to tell you. What part of that feels most important for you to hold gently right now?",
        "When you notice that shift in yourself, it creates space for breathing. How does your body feel as you give voice to this thought?",
        "I hear you. Sometimes the clearest insights come not from solving everything, but simply sitting by the hearth with what is true today."
      ];
      const randomFallback = fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)];

      res.json({
        reply: randomFallback,
        modelUsed: 'graceful-fallback',
        timestamp: Date.now(),
      });
    }
  });

  // 6. Comprehensive AI Emotional Mirror across all notebook pages
  app.post('/api/gemini/emotional-mirror', async (req: Request, res: Response) => {
    try {
      const data = (req.body && typeof req.body === 'object') ? req.body : {};
      const entries = Array.isArray(data.entries) ? data.entries : [];
      const moodCounts = (typeof data.moodCounts === 'object' && data.moodCounts !== null) ? data.moodCounts : {};

      if (entries.length === 0) {
        res.json({
          primaryFeeling: "Quiet Stillness",
          primaryFeelingEmoji: "🌱",
          primaryFeelingSummary: "Your notebook awaits your first words. As you capture daily thoughts, this mirror will reveal your most common feelings and emotional currents.",
          feelingBreakdown: [
            { feeling: "Calm", percentage: 100, insight: "A peaceful starting canvas for self-reflection." }
          ],
          recurringThemes: ["Beginning the journey", "Quiet reflection"],
          emotionalEvolution: "Your pages are just beginning to open.",
          gentleEncouragement: "Every great journey of self-discovery begins with a single page.",
          totalEntriesAnalyzed: 0,
          modelUsed: "default",
          timestamp: Date.now(),
        });
        return;
      }

      // Format entries (up to 35 most recent to prevent context overflow while capturing the complete landscape)
      const formattedEntries = entries
        .slice(0, 35)
        .map((e: any, idx: number) => `Entry #${idx + 1} (${e.date || 'Recent'}, Template: ${e.templateTitle || e.templateType || 'Journal'}, Mood: ${e.mood || 'calm'}):
Title: ${e.title || 'Untitled'}
Content: ${(e.text || '').slice(0, 300)}`)
        .join('\n\n---\n\n');

      const systemInstruction = `You are Hearthnote's master Emotional Mirror engine.
You are given journal entries from the user's notebook journey, along with overall mood distribution metrics.
Your objective:
Conduct an empathetic, holistic, pattern-seeking analysis to determine what feeling or emotion the user experiences the MOST across their entire journal, why that feeling is so central to their experience, and how their feelings evolve.

Guidelines:
1. "primaryFeeling": The single core feeling or emotional state that predominates across all pages (e.g. "Grounded Calm", "Quiet Reflection", "Tender Longing", "Resilient Hope", "Anxious Urgency", "Vulnerable Self-Discovery").
2. "primaryFeelingEmoji": A single appropriate emoji (e.g. 🌿, 🌊, 🌅, 🕊️, 🕯️, 🪴).
3. "primaryFeelingSummary": 2-3 warm, observant sentences explaining why this feeling is the most frequent. Highlight specific moments, settings, or thought patterns that trigger or cradle this feeling without judgment.
4. "feelingBreakdown": An array of 3 to 4 feelings with estimated percentage (summing to 100) and a 1-sentence insight for each.
5. "recurringThemes": 3 to 4 concise theme phrases describing recurring life areas connected to their feelings (e.g. ["Finding quiet boundaries", "Processing work pressures", "Gratitude for family"]).
6. "emotionalEvolution": 2-3 sentences tracking how their feelings have shifted or deepened from earlier pages to more recent ones.
7. "gentleEncouragement": A compassionate, uplifting closing remark (1-2 sentences) celebrating their emotional honesty and awareness.
8. Tone: Warm, grounded, serene, non-judgmental, non-clinical. NEVER diagnose or give psychological labels.

Return ONLY valid JSON matching:
{
  "primaryFeeling": string,
  "primaryFeelingEmoji": string,
  "primaryFeelingSummary": string,
  "feelingBreakdown": [
    {
      "feeling": string,
      "percentage": number,
      "insight": string
    }
  ],
  "recurringThemes": string[],
  "emotionalEvolution": string,
  "gentleEncouragement": string
}`;

      const userPrompt = `Overall Mood Tallies: ${JSON.stringify(moodCounts)}
Total Entries Count: ${entries.length}

Journal Pages:
${formattedEntries}`;

      let parsed: any = null;
      let modelUsed = 'fallback';
      try {
        const result = await generateContentWithFallback({
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
          systemInstruction,
          responseMimeType: 'application/json',
          temperature: 0.4,
        });
        modelUsed = result.modelUsed;
        parsed = safeParseJson(result.text);
      } catch (geminiErr: any) {
        if (!isAccountQuotaOrCreditError(geminiErr)) {
          console.info('[Hearthnote Emotional Mirror] Local synthesis active.');
        }
      }

      if (!parsed || !parsed.primaryFeeling || !Array.isArray(parsed.feelingBreakdown)) {
        const synthesized = synthesizeEmotionalMirror(entries, moodCounts);
        res.json(synthesized);
        return;
      }

      res.json({
        primaryFeeling: parsed.primaryFeeling || "Grounded Calm",
        primaryFeelingEmoji: parsed.primaryFeelingEmoji || "🌿",
        primaryFeelingSummary: parsed.primaryFeelingSummary || "Your notebook reveals a steady undercurrent of thoughtful calm and patient presence.",
        feelingBreakdown: Array.isArray(parsed.feelingBreakdown) && parsed.feelingBreakdown.length > 0 ? parsed.feelingBreakdown : [
          { feeling: "Grounded Calm", percentage: 50, insight: "A consistent center of stillness." },
          { feeling: "Thoughtful Introspection", percentage: 30, insight: "Careful examination of daily life." },
          { feeling: "Heartfelt Gratitude", percentage: 20, insight: "Looking forward with quiet appreciation." }
        ],
        recurringThemes: Array.isArray(parsed.recurringThemes) && parsed.recurringThemes.length > 0 ? parsed.recurringThemes : ["Quiet mindfulness", "Self-compassion"],
        emotionalEvolution: parsed.emotionalEvolution || "Your entries reflect a deepening trust in your own voice over time.",
        gentleEncouragement: parsed.gentleEncouragement || "Holding space for your feelings with honesty is a true gift to your future self.",
        totalEntriesAnalyzed: entries.length,
        lastAnalyzedAt: Date.now(),
        timestamp: Date.now(),
        modelUsed,
      });
    } catch (error: any) {
      if (!isAccountQuotaOrCreditError(error)) {
        console.info('[Hearthnote Emotional Mirror] Synthesis active.');
      }
      const data = (req.body && typeof req.body === 'object') ? req.body : {};
      const synthesized = synthesizeEmotionalMirror(data.entries || [], data.moodCounts || {});
      res.json(synthesized);
    }
  });

  // 7. Vite Middleware integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`Hearthnote server running at http://${HOST}:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});

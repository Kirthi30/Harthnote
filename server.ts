import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

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

async function generateContentWithFallback(options: FallbackOptions): Promise<{ text: string; modelUsed: string }> {
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
      const isRecoverable =
        status === 503 ||
        status === 429 ||
        status === 404 ||
        status === 500 ||
        msg.includes('unavailable') ||
        msg.includes('resource_exhausted') ||
        msg.includes('not found') ||
        msg.includes('internal error') ||
        msg.includes('overloaded') ||
        msg.includes('quota');

      console.warn(`[Gemini Fallback] Model '${modelName}' failed (status: ${status}, recoverable: ${isRecoverable}):`, err?.message || err);

      if (!isRecoverable && MODEL_FALLBACK_LADDER.indexOf(modelName) === MODEL_FALLBACK_LADDER.length - 1) {
        throw err;
      }
      // Continue to next model in ladder
    }
  }

  throw lastError || new Error('All fallback models in the ladder failed to generate response.');
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

      if (aiMemoryLevel === 'none') {
        res.json({
          reflection: '',
          dismissed: true,
          modelUsed: 'none',
        });
        return;
      }

      if (!entryText && Object.keys(promptAnswers).length === 0) {
        res.json({
          reflection: 'Your thoughts have been warmly preserved in your notebook.',
          modelUsed: 'default',
        });
        return;
      }

      const answersSummary = Object.entries(promptAnswers)
        .map(([k, v]) => `- ${v}`)
        .join('\n');

      const userContent = `Journal Template: ${templateTitle}
Mood: ${mood}
Prompt Reflections:
${answersSummary || 'None'}

Entry Content:
${entryText}`;

      const systemInstruction = `You are the gentle companion inside Hearthnote, a private personal notebook.
Your purpose is to offer a quiet, non-intrusive "gentle thought" to the writer after they close their entry.

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
        timestamp: Date.now(),
      });
    } catch (error: any) {
      console.error('Error generating gentle reflection:', error);
      res.status(500).json({
        error: error?.message || 'Failed to generate gentle reflection from Gemini.',
      });
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
You review a week of the user's private journal entries and construct an empathetic, gentle weekly summary.

Guidelines:
- "moodTrendSummary": 1-2 warm sentences capturing the emotional curve of the week without judgment.
- "themes": Exactly 2 to 3 concise, poetic theme phrases (3-6 words each) reflecting what they focused on (e.g. ["Protecting quiet mornings", "Releasing late-night urgency", "Grounded sensory gratitude"]).
- "reflectionQuestions": Exactly 2 gentle, open reflection inquiries to ponder over the weekend.
- "disclaimer": Always "AI-generated reflection · A quiet mirror, not advice."
- Tone: Warm, grounded, non-clinical. Never give medical/therapeutic instructions.

Return ONLY valid JSON matching this schema:
{
  "moodTrendSummary": string,
  "themes": string[],
  "reflectionQuestions": string[],
  "disclaimer": string
}`;

      const userPrompt = `Weekly Mood Distribution: ${JSON.stringify(moodCounts)}
Journal Entries:
${formattedEntries}`;

      const result = await generateContentWithFallback({
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.4,
      });

      let parsed: any;
      try {
        parsed = JSON.parse(result.text);
      } catch (jsonErr) {
        const clean = result.text.replace(/```json/g, '').replace(/```/g, '').trim();
        parsed = JSON.parse(clean);
      }

      res.json({
        moodTrendSummary: parsed.moodTrendSummary || 'Your week held moments of quiet reflection and steady presence.',
        themes: Array.isArray(parsed.themes) && parsed.themes.length > 0 ? parsed.themes : ['Quiet presence', 'Gentle pacing'],
        reflectionQuestions: Array.isArray(parsed.reflectionQuestions) && parsed.reflectionQuestions.length > 0 ? parsed.reflectionQuestions : ['What small pause supported you most this week?'],
        disclaimer: parsed.disclaimer || 'AI-generated reflection · A quiet mirror, not advice.',
        modelUsed: result.modelUsed,
      });
    } catch (error: any) {
      console.error('Error generating weekly reflection:', error);
      res.status(500).json({
        error: error?.message || 'Failed to generate weekly reflection.',
      });
    }
  });

  // 4. Vite Middleware integration
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

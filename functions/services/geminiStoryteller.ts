import { StorytellerResult } from '../types';

export class GeminiStoryteller {
  // Model fallback chain: uses current active models with graceful fallback
  private modelChain = [
    'gemini-3.5-flash-lite',
    'gemini-flash-lite-latest',
    'gemini-3.8-flash',
    'gemini-3.5-flash',
    'gemini-3.1-flash-lite',
    'gemini-flash-latest',
  ];

  /**
   * Generate an engaging Mizo storytelling caption for facts, nature wonders, science or history
   */
  public async tellStory(
    title: string,
    englishText: string,
    category: string = 'facts',
    primaryKey?: string,
    fallbackKey?: string,
    customPrompt?: string,
    extraKey?: string
  ): Promise<StorytellerResult> {
    const keys = [
      (primaryKey || '').trim(),
      (fallbackKey || '').trim(),
      (extraKey || '').trim(),
    ].filter(Boolean);

    if (keys.length === 0) {
      // Fallback if no Gemini key is configured yet
      return {
        mizoTitle: title,
        mizoCaption: `${title}\n\n${englishText}\n\n#FinnaKailawn #Thilmak #Facts`,
      };
    }

    const systemPrompt = `You are the lead storyteller and creative Mizo editor for "Finna Kailawn", a popular Mizo page focusing on amazing world facts, scientific discoveries, nature wonders, history, and space mysteries.

Your goal is to transform English facts, research papers, or discovery summaries into captivating, natural, and fluent Mizo storytelling that everyday readers love.

CRITICAL MIZO GRAMMAR & STYLE RULES:
1. OPENING HOOK: Start with an attention-grabbing hook suited to the story:
   Examples:
   - "I lo hre ve tawh em? 🌍"
   - "Khawvel Thilmak:"
   - "I hria em?"
   - "Hriatzauna:"
   - "Hmanlai khawvel thilmak:"
   - "Van thengreng chanchin mak:"

2. NATURAL STORYTELLING (Avoid stiff word-for-word translation):
   - Write clear, engaging, story-driven Mizo paragraphs.
   - Use vivid vocabulary (e.g. "mak tak mai chu", "zirchianna thar aṭangin", "kan hriat ngai loh thil thar", "chhut phak bakin").
   - Follow standard Mizo grammar: proper subject markers (-n, -a'n, -in, e.g. "NASA-in an hmuhchhuah danin", "Albert Einstein-a'n a sawi angin").

3. CLEAN HASHTAGS:
   - Conclude naturally with relevant hashtags:
     #FinnaKailawn #Thilmak #Facts #${category.toUpperCase()} #Science #Discoveries

4. ZERO EXTERNAL LINKS:
   - NEVER include external URLs or website links in the caption (Meta algorithm penalizes external links in captions).

5. FORMAT:
   Return valid JSON with:
   {
     "mizo_title": "<Catchy short Mizo headline (1 line)>",
     "mizo_caption": "<Complete Mizo Facebook caption with hook, storytelling body, and hashtags>"
   }`;

    const userPrompt = `Category: ${category}
Original Title: ${title}
Original Content:
${englishText}
${customPrompt ? `\nSpecial User Instruction: ${customPrompt}` : ''}

Generate the Mizo title and storytelling caption in JSON format now:`;

    const contents = [
      {
        parts: [
          { text: systemPrompt },
          { text: userPrompt },
        ],
      },
    ];

    let lastError: any = null;

    for (const model of this.modelChain) {
      for (const key of keys) {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

        try {
          const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents,
              generationConfig: {
                temperature: 0.4,
                maxOutputTokens: 1200,
                responseMimeType: 'application/json',
              },
            }),
          });

          if (res.status === 429) {
            console.warn(`[Gemini] Model ${model} hit rate limit (429). Trying fallback key or model...`);
            continue;
          }

          if (!res.ok) {
            const errText = await res.text();
            console.warn(`[Gemini] Model ${model} HTTP ${res.status}: ${errText.slice(0, 100)}`);
            continue;
          }

          const data = (await res.json()) as any;
          const rawOutput = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!rawOutput) continue;

          const cleaned = rawOutput
            .replace(/^```json\s*/i, '')
            .replace(/^```\s*/i, '')
            .replace(/```\s*$/, '')
            .trim();

          const parsed = JSON.parse(cleaned);
          const mizoTitle = parsed.mizo_title || parsed.title || title;
          const mizoCaption = parsed.mizo_caption || parsed.caption || parsed.content || '';

          if (mizoCaption.trim()) {
            return {
              mizoTitle: mizoTitle.trim(),
              mizoCaption: mizoCaption.trim(),
            };
          }
        } catch (err: any) {
          lastError = err;
          console.warn(`[Gemini] Error with model ${model}:`, err.message);
        }
      }
    }

    if (lastError) {
      console.error('[Gemini] All models/keys failed. Error:', lastError.message);
    }

    // Ultimate fallback if API fails
    return {
      mizoTitle: title,
      mizoCaption: `Khawvel Thilmak:\n\n${title}\n\n${englishText.slice(0, 400)}...\n\n#FinnaKailawn #Thilmak #Facts`,
    };
  }
}

export const geminiStoryteller = new GeminiStoryteller();

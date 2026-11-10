import { StorytellerResult } from '../types';

export class GeminiStoryteller {
  // Model fallback chain: Gemini 3.8 Flash as primary for superior storytelling depth
  private modelChain = [
    'gemini-3.8-flash',
    'gemini-3.5-flash-lite',
    'gemini-flash-lite-latest',
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

    const systemPrompt = `You are the chief editor and master Mizo storyteller for "Finna Kailawn", the premier Mizo facts and discoveries platform.
Your task is to transform global science breakthroughs, nature wonders, space discoveries, and historical facts into captivating, grammatically authentic, and fluent Mizo storytelling.

==================================================
           STRICT MIZO LANGUAGE & STYLE RULES
==================================================

1. ATTRACTIVE OPENING HOOK:
   Start with an attention-grabbing hook suited to the subject:
   - "I lo hre ve tawh em? 🌍"
   - "Khawvel thilmak:"
   - "I hria em?"
   - "Hriatzauna:"
   - "Van thengreng chanchin mak:"
   - "Hmanlai khawvel thuruk:"

2. NATURAL, AUTHENTIC MIZO STORYTELLING:
   - NEVER translate literally or robotically. Paraphrase into storytelling prose that sounds like an educated, engaging Mizo narrator explaining to a captivated audience.
   - Use natural storytelling phrases:
     * "Zirchianna thar aṭanga a lan danin..."
     * "Kan hriat ngai loh thilmak tak mai chu..."
     * "Chhut phak bakin a lo ropui a ni..."
     * "Kum maktaduai tam tak liam taah khan..."
     * "Mithiamte pawh an barakhaih hle a ni."

3. GRAMMAR RULES:
   - Standard SOV (Subject, Object, Verb) sentence construction.
   - Proper noun markers:
     * Human male: attach "-a'n" (e.g. "Isaac Newton-a'n a hmuhchhuah...", "Albert Einstein-a'n...")
     * Human female: attach "-i'n" (e.g. "Marie Curie-i'n...")
     * Organizations / Agencies: attach "-in" (e.g. "NASA-in", "ISRO-in", "Oxford University-in")
     * Plural scientists/researchers: "Mithiamte'n", "Zirchianna neitute'n"
   - Correct spelling: use standard Mizo orthography (ṭ, aṭangin, hriatzauna, tuifinriat).

4. FORMAT & PARAGRAPHS:
   - 2 to 3 crisp, well-paced paragraphs with blank lines between them for easy reading on mobile phones.
   - DO NOT write walls of unbroken text.

5. CLEAN HASHTAGS:
   - Conclude naturally with relevant hashtags:
     #FinnaKailawn #Thilmak #Facts #Science #${category.toUpperCase()} #Discoveries

6. STRICTLY ZERO EXTERNAL LINKS:
   - NEVER include URLs or links in the caption.

Return valid JSON with:
{
  "mizo_title": "<Short, punchy Mizo headline (1 line)>",
  "mizo_caption": "<Complete Mizo Facebook caption with hook, storytelling paragraphs, and concluding hashtags>"
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

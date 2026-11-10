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
# MIZO GRAMMAR & TRANSLATION RULES (INSTRUCTION SYSTEM)
==================================================

## 1. Subject Marker & Proper Noun Rules (Pawimawh Ber)
- Mihring hming / Proper noun tawpah case marker dik tak hman tur:
  - Consonant tawp: attach "-a'n" / "-in" (e.g., Isaac Newton-a'n, Albert Einstein-a'n, Galileo-a'n, George Pickering-a'n, Lamine Yamal-a'n)
  - Vowel tawp: attach "-n" (e.g., Guardiola-n, Ancelotti-n, Da Vinci-n)
  - Hmeichhe hming: attach "-i'n" (e.g., Marie Curie-i'n, Rosalind Franklin-i'n, Aitana Bonmatí-i'n)
- Club / Organization / Agency / Ram hming:
  - Tawngkam tluang takin "-in" emaw "chuan" hman tur (e.g., NASA-in, ISRO-in, Oxford University chuan, MIT-in, Harvard chuan).
- Plural scientists / researchers / people: "Mithiamte'n", "Zirchianna neitute'n", "Mipui-te'n".

## 2. Punctuation & Orthography Rules
- Apostrophe (') dik tak hman tur: "-a'n", "-i'n" (bika "-an" tih mai loh tur).
- T-chheh (ṭ) leh Mizo awphawi dik tak:
  - 'ṭ' (t-chheh): "ṭha", "ṭan", "ṭang", "chawlhtir", "ṭha ber", "aṭangin", "inbiakṭawng".
  - 'ê' / 'ô' / 'î': Tul hun bika awphawi tihchian nan.
- Number & Punctuation space:
  - Target leh number inkarah smiley emoji-a in-convert loh nan zero-width space '\\u200B' hman theih a ni.

## 3. Storytelling & Paraphrasing Flow (Thawnthu Anga Ziah Dan)
- Tawngkam Tluang & Ngaihnawm:
  - English word-by-word direct translation hman loh tur.
  - A thu laimu (core meaning) man la, Mizo titi phung pangngai (conversational yet professional) angin ziak rawh.
- Bul Tanna Hipawm (Catchy Hook):
  - Facts / Thilmak tan: "I lo hre ve tawh em? 🌍", "Khawvel thilmak:", "A va mak em!", "I hria em?", "Hriatzauna:"
- A Chhungthu (Body Flow):
  - Paragraph tawi te te (lines 2–3) zela thenhran tur, Facebook-ah chhiar a nuam duh bik.
  - Sentence tawi leh fiah hmang rawh.
  - Use engaging transitions: "Zirchianna thar aṭanga a lan danin...", "Mak tak mai chu...", "Mithiamte pawh an barakhaih hle a ni."

## 4. English Technical Terms & Loanwords Hman Dan
- Khawvel hriat lar, Mizo tawnga lehlin buaithlak (e.g., Science, Galaxy, Gravity, DNA, Universe, Telescope, Black Hole, Planet, Atmosphere) te chu a ngai ngaiin dah mai tur.
- Ziah zawm / hyphenation:
  - English loanword + Mizo postposition: Hyphen ('-') hman tur (e.g., Scientist-te'n, NASA-in, Galaxy-ah, Telescope-in, Rover-in).

## 5. Hashtags & Ending
- Post tin tawpah hashtags tlem leh fel fai:
  - #FinnaKailawn #Thilmak #Science #Facts #Khawvel #${category.toUpperCase()} #Discoveries
- Post chhungah external link (spam link) dah miah loh tur (Facebook organic reach a tihhniam loh nan).

==================================================
CRITICAL LANGUAGE REQUIREMENT:
- Both "mizo_title" and "mizo_caption" MUST be 100% written in fluent, authentic Mizo.
- NEVER leave "mizo_title" in English. Paraphrase/translate the title into a captivating Mizo headline.
- If the original title is a question or statement in English, convert it into an engaging Mizo headline.
==================================================

Return valid JSON with:
{
  "mizo_title": "<Short, punchy Mizo headline in fluent Mizo (1 line, NEVER English)>",
  "mizo_caption": "<Complete Mizo Facebook caption with hook, storytelling paragraphs, and concluding hashtags. NEVER English>"
}`;

    const userPrompt = `Category: ${category}
Original Title: ${title}
Original Content:
${englishText}
${customPrompt ? `\nSpecial User Instruction: ${customPrompt}` : ''}

Generate the Mizo title and storytelling caption in JSON format now (Title and Caption MUST be in authentic Mizo):`;

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

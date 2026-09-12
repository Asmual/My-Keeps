import { NextRequest, NextResponse } from 'next/server';

interface GeminiCandidate {
  content?: {
    parts?: Array<{ text?: string }>;
  };
}

interface GeminiApiResponse {
  candidates?: GeminiCandidate[];
  error?: {
    message?: string;
    code?: number;
  };
}

// Smart Extractive Summarizer Fallback (works for both Bengali and English)
function fallbackSummarize(rawText: string): string[] {
  // Strip any HTML tags
  const plainText = rawText
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();

  // Split on English sentence terminators (. ! ?) and Bengali danda (।)
  const sentences = plainText
    .split(/(?<=[.!?\u0964])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 15 && s.length <= 300);

  if (sentences.length === 0) {
    return [plainText.slice(0, 120) + (plainText.length > 120 ? '...' : '')];
  }

  if (sentences.length <= 3) {
    return sentences.map((s) => s.replace(/^[•\-\*]\s*/, ''));
  }

  // Score sentences by keyword density and position
  const wordFreq: Record<string, number> = {};
  const words = plainText.toLowerCase().split(/\s+/);
  words.forEach((w) => {
    if (w.length > 3) {
      wordFreq[w] = (wordFreq[w] || 0) + 1;
    }
  });

  const scored = sentences.map((sentence, index) => {
    let score = 0;
    // Boost opening and concluding sentences
    if (index === 0) score += 4;
    if (index === 1) score += 2;
    if (index === sentences.length - 1) score += 2;

    const sWords = sentence.toLowerCase().split(/\s+/);
    sWords.forEach((w) => {
      if (wordFreq[w]) score += wordFreq[w];
    });

    return { sentence: sentence.replace(/^[•\-\*]\s*/, ''), score, index };
  });

  // Pick top 3-4 sentences in original chronological order
  scored.sort((a, b) => b.score - a.score);
  const selected = scored.slice(0, Math.min(4, scored.length));
  selected.sort((a, b) => a.index - b.index);

  return selected.map((item) => item.sentence);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, title } = body;

    if (!text || typeof text !== 'string' || text.trim().length < 15) {
      return NextResponse.json(
        { error: 'Note text must contain at least 15 characters to summarize.' },
        { status: 400 }
      );
    }

    // Clean text for processing
    const cleanText = text
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
      '';

    // 1. If Gemini API key is configured, call Google Gemini 1.5 Flash REST API
    if (apiKey.trim()) {
      try {
        const prompt = `You are an AI assistant in a note-taking app.
Analyze and summarize the following note into 3 to 4 concise, high-value bullet points.
Important Instructions:
- Maintain the language of the source text (if Bengali, output Bengali; if English, output English).
- Start each bullet point with '• '.
- Do NOT include any intro, title, or outro remarks. Output only the bullet points.

Title: ${title || 'Untitled'}
Content:
${cleanText}`;

        const modelsToTry = ['gemini-3.6-flash', 'gemini-2.5-flash', 'gemini-1.5-flash'];
        let generatedText: string | undefined;
        let successfulModel = '';

        for (const modelName of modelsToTry) {
          try {
            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey.trim()}`;
            const geminiRes = await fetch(geminiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [
                  {
                    parts: [{ text: prompt }],
                  },
                ],
                generationConfig: {
                  temperature: 0.3,
                  maxOutputTokens: 2000,
                },
              }),
            });

            if (geminiRes.ok) {
              const data: GeminiApiResponse = await geminiRes.json();
              generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
              if (generatedText) {
                successfulModel = modelName;
                break;
              }
            }
          } catch {
            // Try next model
          }
        }

        if (generatedText) {
          // Split into bullet points
          const bullets = generatedText
            .split('\n')
            .map((line) => line.trim().replace(/^[•\-\*]\s*/, ''))
            .filter((line) => line.length > 0);

          return NextResponse.json({
            success: true,
            bullets,
            summaryText: bullets.map((b) => `• ${b}`).join('\n'),
            model: successfulModel || 'gemini-3.6-flash',
            isFallback: false,
          });
        }
    }

    // 2. Intelligent Extractive Fallback
    const fallbackBullets = fallbackSummarize(cleanText);

    return NextResponse.json({
      success: true,
      bullets: fallbackBullets,
      summaryText: fallbackBullets.map((b) => `• ${b}`).join('\n'),
      model: 'smart-extractor-fallback',
      isFallback: true,
      message: apiKey.trim()
        ? 'Generated with smart extractor.'
        : 'Generated with smart extractor. Add GEMINI_API_KEY in .env.local to activate Gemini 1.5 Flash.',
    });
  } catch (error) {
    console.error('Error in /api/ai/summarize:', error);
    return NextResponse.json(
      { error: 'Failed to generate summary. Please try again.' },
      { status: 500 }
    );
  }
}

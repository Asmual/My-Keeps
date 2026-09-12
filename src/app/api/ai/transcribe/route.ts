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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { audioData, language = 'bn-BD' } = body;

    if (!audioData || typeof audioData !== 'string') {
      return NextResponse.json(
        { error: 'Audio data is required for transcription.' },
        { status: 400 }
      );
    }

    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
      '';

    if (!apiKey.trim()) {
      return NextResponse.json(
        { error: 'Gemini API key is not configured.' },
        { status: 500 }
      );
    }

    // Extract base64 and mimeType from data URL
    let base64Data = audioData;
    let mimeType = 'audio/webm';

    if (audioData.includes(';base64,')) {
      const parts = audioData.split(';base64,');
      mimeType = parts[0].replace(/^data:/, '');
      base64Data = parts[1];
    }

    const prompt = `Please accurately transcribe the speech in this audio recording into written text.
Language instruction: The speaker speaks in ${
      language === 'en-US' ? 'English' : 'Bengali (বাংলা)'
    }.
If the audio contains speech, output ONLY the exact transcribed text.
Do NOT include any greetings, notes, explanations, timestamps, or quotes. Output plain transcribed text only.`;

    const modelsToTry = ['gemini-3.6-flash', 'gemini-2.5-flash'];
    let transcribedText = '';

    for (const model of modelsToTry) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;

        const res = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
                  {
                    inlineData: {
                      mimeType,
                      data: base64Data,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 2000,
            },
          }),
        });

        if (res.ok) {
          const data: GeminiApiResponse = await res.json();
          const resultText =
            data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (resultText) {
            transcribedText = resultText;
            break;
          }
        }
      } catch (err) {
        console.warn(`Model ${model} transcription attempt failed:`, err);
      }
    }

    if (!transcribedText) {
      return NextResponse.json(
        { error: 'Could not transcribe speech from audio. Please ensure voice is clear.' },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      text: transcribedText,
    });
  } catch (error) {
    console.error('Error in /api/ai/transcribe:', error);
    return NextResponse.json(
      { error: 'Failed to transcribe audio' },
      { status: 500 }
    );
  }
}

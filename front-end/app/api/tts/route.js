import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { text, voiceId } = await req.json();

    const apiKey = process.env.ELEVENLABS_API_KEY;
    const ttsRes = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      },
    );
    if (!ttsRes.ok) {
      return NextResponse.json(
        { error: 'Failed to generate audio' },
        { status: ttsRes.status },
      );
    }

    const buffer = await ttsRes.arrayBuffer();

    return new Response(buffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
      },
    });
  } catch (err) {
    console.error('TTS Server Error:', err);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}

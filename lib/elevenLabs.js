export async function generateVoiceBuffer(text) {
  const voiceId = 'KoVIHoyLDrQyd4pGalbs';
  const apiKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY;
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    },
  );

  if (!res.ok) throw new Error('Failed to generate audio from ElevenLabs');
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

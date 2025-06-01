import { getRedisClient } from './redis';

export async function generateVoiceBuffer(text, callSid) {
  const client = await getRedisClient();
  const voiceId = await client.get(`voiceId:${callSid}`);
  const apiKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY;
  let res;
  try {
    res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
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
  } catch (error) {
    console.log(error.message);
  }

  if (!res.ok) {
    const errorText = await res.text();
    console.error('ElevenLabs Error:', res.status, errorText);
    throw new Error('Failed to generate audio from ElevenLabs');
  }
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

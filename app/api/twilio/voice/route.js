import { twiml } from 'twilio';

export async function POST(req) {
  const { searchParams } = new URL(req.url);
  const msg = searchParams.get('msg') || 'Hello from Zena-AI';

  const voiceResponse = new twiml.VoiceResponse();
  voiceResponse.say({ voice: 'Polly.Joanna', language: 'en-US' }, msg);

  voiceResponse.record({
    maxLength: 30,
    // transcribe: true,
    // transcribeCallback: `${process.env.NEXT_PUBLIC_BASE_URL}/api/twilio/transcription`,
    action: `${process.env.NEXT_PUBLIC_BASE_URL}/api/twilio/after-recording`,
    method: 'POST',
    finishOnKey: '#',
  });

  return new Response(voiceResponse.toString(), {
    headers: {
      'Content-Type': 'text/xml',
    },
  });
}

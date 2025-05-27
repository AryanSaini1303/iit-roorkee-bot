import { twiml } from 'twilio';

export async function POST() {
  const response = new twiml.VoiceResponse();
  response.hangup();

  return new Response(response.toString(), {
    headers: {
      'Content-Type': 'text/xml',
    },
  });
}

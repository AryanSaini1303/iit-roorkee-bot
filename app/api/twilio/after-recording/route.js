import { twiml } from 'twilio';

export async function POST() {
  const response = new twiml.VoiceResponse();
  response.play(
    'https://x8kvogjfhjihtrrx.public.blob.vercel-storage.com/thankYou-Ns1PPq5miOzZ1BT13wTTN2h8dONtZy.mp3',
  );
  response.hangup();

  return new Response(response.toString(), {
    headers: {
      'Content-Type': 'text/xml',
    },
  });
}

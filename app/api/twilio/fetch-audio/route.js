import { appendMessage } from '@/lib/convoStore';
import { getRedisClient } from '@/lib/redis';
import { twiml } from 'twilio';

export async function POST(req) {
  const form = await req.formData();
  const callSid = form.get('CallSid');
  const client = await getRedisClient();
  const callEnded = await client.get(`callEnded:${callSid}`);
  const response = new twiml.VoiceResponse();
  const audioUrl = await client.get(`audioUrl:${callSid}`);
  const lang = await client.get(`lang:${callSid}`);

  if (callEnded === 'true') {
    await appendMessage(callSid, {
      role: 'system',
      content:
        lang === 'English'
          ? 'Thank you for your response'
          : 'Terima kasih atas maklum balas anda',
    });
    const media =
      lang === 'English'
        ? 'https://x8kvogjfhjihtrrx.public.blob.vercel-storage.com/thankYou-Ns1PPq5miOzZ1BT13wTTN2h8dONtZy.mp3'
        : 'https://x8kvogjfhjihtrrx.public.blob.vercel-storage.com/thankYou2-5RNIAreL6uKs03wYvgHNklrwyr65qG.mp3';
    response.play(media);
    // const client = await getRedisClient();
    await client.del(`voiceId:${callSid}`);
    // await client.del(`audioUrl:${callSid}`);
    response.hangup();
    return new Response(response.toString(), {
      headers: { 'Content-Type': 'text/xml' },
    });
  } else if (audioUrl) {
    response.play(audioUrl);
    await client.del(`audioUrl:${callSid}`);
    response.record({
      maxLength: 30,
      timeout: 5,
      playBeep: true,
      action: `${process.env.NEXT_PUBLIC_BASE_URL}/api/twilio/after-recording`,
      method: 'POST',
      finishOnKey: '#',
    });
  } else {
    const media =
      lang === 'English'
        ? 'https://x8kvogjfhjihtrrx.public.blob.vercel-storage.com/pleaseWait-1x0bupupWcO4EqzmCNpNtMrpbb1whW.mp3'
        : 'https://x8kvogjfhjihtrrx.public.blob.vercel-storage.com/pleaseWait2-gSyKX9ibtiatAAHB6hIv7tJ3jRG7PR.mp3';
    response.play(media);
    response.pause({ length: 3 });
    response.redirect('/api/twilio/fetch-audio');
  }

  return new Response(response.toString(), {
    headers: { 'Content-Type': 'text/xml' },
  });
}

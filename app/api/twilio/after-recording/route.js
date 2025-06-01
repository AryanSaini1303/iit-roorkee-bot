import { uploadToVercelBlob } from '@/lib/blobUploader';
import { appendMessage, getConversation } from '@/lib/convoStore';
import { generateVoiceBuffer } from '@/lib/elevenLabs';
import { generateAIReply } from '@/lib/getResponse';
import GetTranscription from '@/lib/getTranscription';
import { getRedisClient } from '@/lib/redis';
import { twiml } from 'twilio';

export async function POST(req) {
  const form = await req.formData();
  const response = new twiml.VoiceResponse();
  const callSid = form.get('CallSid');
  const recordingUrl = form.get('RecordingUrl');
  const client = await getRedisClient();

  // silence leads to no recording url so we hangup the call with a thankyou note
  // console.log(recordingUrl);
  const transcript = await GetTranscription(recordingUrl);
  if (!transcript || transcript.trim().length < 3) {
    const lang = await client.get(`lang:${callSid}`);
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
    await client.del(`voiceId:${callSid}`);
    response.hangup();
    return new Response(response.toString(), {
      headers: { 'Content-Type': 'text/xml' },
    });
  }
  await appendMessage(callSid, { role: 'user', content: transcript });
  const context = await getConversation(callSid);
  const aiReply = await generateAIReply(context);
  let isEndCall = false;
  try {
    const parsed = JSON.parse(aiReply);
    if (parsed?.intent === 'end-call') {
      isEndCall = true;
    }
  } catch (err) {}
  if (isEndCall) {
    const lang = await client.get(`lang:${callSid}`);
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
    response.hangup();
    return new Response(response.toString(), {
      headers: { 'Content-Type': 'text/xml' },
    });
  } else {
    await appendMessage(callSid, { role: 'system', content: aiReply });
    const voiceBuffer = await generateVoiceBuffer(aiReply, callSid);
    const publicUrl = await uploadToVercelBlob(voiceBuffer);
    response.play(publicUrl);
    response.record({
      maxLength: 30,
      timeout: 5,
      playBeep: true,
      action: `${process.env.NEXT_PUBLIC_BASE_URL}/api/twilio/after-recording`,
      method: 'POST',
      finishOnKey: '#',
    });
  }

  return new Response(response.toString(), {
    headers: {
      'Content-Type': 'text/xml',
    },
  });
}

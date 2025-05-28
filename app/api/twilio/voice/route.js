import { twiml } from 'twilio';
import { generateVoiceBuffer } from '@/lib/elevenLabs';
import { uploadToVercelBlob } from '@/lib/blobUploader';
import { appendMessage } from '@/lib/convoStore';

export async function POST(req) {
  const form = await req.formData();
  const { searchParams } = new URL(req.url);
  const callSid=form.get("CallSid");
  const msg = searchParams.get('msg') || 'Hello from Zena-AI';
  await appendMessage(callSid, {role:"system", content:msg});
  const voiceBuffer = await generateVoiceBuffer(msg);
  // const fileName = `zena-ai-${Date.now()}.mp3`;
  // const publicUrl = await uploadToVercelBlob(voiceBuffer, fileName);
  const publicUrl = await uploadToVercelBlob(voiceBuffer);

  const response = new twiml.VoiceResponse();

  response.play(publicUrl); // Twilio plays directly from Vercel Blob

  response.record({
    maxLength: 30,
    action: `${process.env.NEXT_PUBLIC_BASE_URL}/api/twilio/after-recording`,
    method: 'POST',
    finishOnKey: '#',
  });

  return new Response(response.toString(), {
    headers: {
      'Content-Type': 'text/xml',
    },
  });
}

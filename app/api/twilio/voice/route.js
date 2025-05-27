import { twiml } from 'twilio';
import { generateVoiceBuffer } from '@/lib/elevenLabs';
import { uploadToVercelBlob } from '@/lib/blobUploader';

export async function POST(req) {
  const { searchParams } = new URL(req.url);
  const msg = searchParams.get('msg') || 'Hello from Zena-AI';

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

import { uploadToVercelBlob } from '@/lib/blobUploader';
import {
  appendMessage,
  getConversation,
} from '@/lib/convoStore';
import { generateVoiceBuffer } from '@/lib/elevenLabs';
import { generateAIReply } from '@/lib/getResponse';
import GetTranscription from '@/lib/getTranscription';
import { twiml } from 'twilio';

export async function POST(req) {
  const form = await req.formData();
  const response = new twiml.VoiceResponse();
  const callSid = form.get('CallSid');
  const recordingUrl = form.get('RecordingUrl');

  // silence leads to no recording url so we hangup the call with a thankyou note
  // console.log(recordingUrl);
  const transcript = await GetTranscription(recordingUrl);
  if (!transcript || transcript.trim().length < 3) {
    await appendMessage(callSid, {
      role: 'system',
      content: 'Thank you for your response',
    });
    response.play(
      'https://x8kvogjfhjihtrrx.public.blob.vercel-storage.com/thankYou-Ns1PPq5miOzZ1BT13wTTN2h8dONtZy.mp3',
    );
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
    await appendMessage(callSid, {
      role: 'system',
      content: 'Thank you for your response',
    });
    response.play(
      'https://x8kvogjfhjihtrrx.public.blob.vercel-storage.com/thankYou-Ns1PPq5miOzZ1BT13wTTN2h8dONtZy.mp3',
    );
    response.hangup();
    return new Response(response.toString(), {
      headers: { 'Content-Type': 'text/xml' },
    });
  } else {
    await appendMessage(callSid, { role: 'system', content: aiReply });
    const voiceBuffer = await generateVoiceBuffer(aiReply);
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

import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import GetTranscription from '@/lib/getTranscription';
import { appendMessage, getConversation } from '@/lib/convoStore';
import { generateAIReply } from '@/lib/getResponse';
import { generateVoiceBuffer } from '@/lib/elevenLabs';
import { getRedisClient } from '@/lib/redis';

export async function POST(req) {
  const { recordingUrl, callSid } = await req.json();

  try {
    // console.log(recordingUrl);
    const userText = await GetTranscription(`${recordingUrl}.mp3`);
    await appendMessage(callSid, { role: 'user', content: userText });

    const messages = await getConversation(callSid);
    const aiReply = await generateAIReply(messages);
    // console.log(userText);
    if (
      aiReply === '{"intent": "end-call"}' ||
      !userText ||
      userText.length < 3
    ) {
      const client = await getRedisClient();
      await client.set(`callEnded:${callSid}`, 'true', { EX: 900 });
      await client.del(`audioUrl:${callSid}`);
      return NextResponse.json({ intent: 'end-call' });
    }

    await appendMessage(callSid, { role: 'assistant', content: aiReply });
    const voiceBuffer = await generateVoiceBuffer(aiReply, callSid);
    const blobRes = await put(`audio-${callSid}.mp3`, voiceBuffer, {
      access: 'public',
    });
    const client = await getRedisClient();
    await client.set(`audioUrl:${callSid}`, blobRes.url, { EX: 900 }); // 15 minutes

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Processing failed:', err);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function GetTranscription(url) {
  // Poll every 1 second until the file is available
  let res;
  while (true) {
    res = await fetch(url);
    if (res.ok) break;
    await new Promise((r) => setTimeout(r, 1000)); // wait 1 second before retry
  }

  const arrayBuffer = await res.arrayBuffer();
  const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });

  const file = new File([blob], 'recording.mp3', {
    type: 'audio/mpeg',
  });

  const transcription = await openai.audio.transcriptions.create({
    file,
    model: 'whisper-1',
  });

  // console.log(transcription.text);
  return transcription.text;
}

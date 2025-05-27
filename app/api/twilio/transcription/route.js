import { NextResponse } from 'next/server';

export async function POST(req) {
  const formData = await req.formData();
  const recordingUrl = formData.get('RecordingUrl');
//   const transcriptionText = formData.get('TranscriptionText');
  const callSid = formData.get('CallSid');

  console.log('Received recording:', recordingUrl);
  // console.log('Transcription text:', transcriptionText);
  console.log('Call SID:', callSid);

  return NextResponse.json({ status: 'received' });
}

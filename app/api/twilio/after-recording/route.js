import { NextResponse } from 'next/server';
import { twiml } from 'twilio';

export async function POST(req) {
  const form = await req.formData();
  const recordingUrl = form.get('RecordingUrl');
  const callSid = form.get('CallSid');

  if (!recordingUrl || !callSid) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  // Trigger background processing — don’t await it
  fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/twilio/process-audio`, {
    method: 'POST',
    body: JSON.stringify({ recordingUrl, callSid }),
    headers: { 'Content-Type': 'application/json' },
  }).catch(console.error);

  // Immediate response to Twilio
  const response = new twiml.VoiceResponse();
  // response.say('Give me a sec');
  response.redirect('/api/twilio/fetch-audio');

  return new Response(response.toString(), {
    headers: { 'Content-Type': 'text/xml' },
  });
}

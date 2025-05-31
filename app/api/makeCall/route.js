import { NextResponse } from 'next/server';
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioClient = twilio(accountSid, authToken);
const twilioNumber = process.env.TWILIO_PHONE_NUMBER;

export async function POST(req) {
  try {
    const body = await req.json();
    const { to, message, voiceId } = body;
    const call = await twilioClient.calls.create({
      to,
      from: twilioNumber,
      url: `${
        process.env.NEXT_PUBLIC_BASE_URL
      }/api/twilio/voice?msg=${encodeURIComponent(message)}&voiceId=${voiceId}`,
      method: 'POST',
      statusCallback: `${process.env.NEXT_PUBLIC_BASE_URL}/api/twilio/call-status`, // 👈 this will receive final call status
      statusCallbackEvent: ['completed'],
      statusCallbackMethod: 'POST',
    });

    return NextResponse.json({ success: true, callSid: call.sid });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

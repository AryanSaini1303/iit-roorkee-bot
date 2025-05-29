import twilio from 'twilio';

const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

export async function POST(req) {
  const { callSid } = await req.json();

  try {
    const recordings = await client.recordings.list({ callSid });

    if (!recordings.length) {
      return Response.json({ message: 'No recording found yet' });
    }

    // const recording = recordings[0];
    // const recordingUrl = `https://api.twilio.com${recording.uri.replace('.json', '.mp3')}`;
    const recordingUrls = recordings.map(
      (recording) =>
        `https://api.twilio.com${recording.uri.replace('.json', '.mp3')}`,
    );

    return Response.json({ recordingUrls });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

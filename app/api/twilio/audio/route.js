export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const rawUrl = searchParams.get('url');

  if (!rawUrl) {
    return new Response('Missing recording URL', { status: 400 });
  }

  const match = rawUrl.match(/Recordings\/(RE[a-zA-Z0-9]+)\.mp3/);
  if (!match) {
    return new Response('Invalid Twilio Recording URL format', { status: 400 });
  }

  const recordingSid = match[1];

  const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
  const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
  const authHeader = 'Basic ' + Buffer.from(`${ACCOUNT_SID}:${AUTH_TOKEN}`).toString('base64');

  const isReady = await waitForRecordingToBeReady(recordingSid, authHeader);
  if (!isReady) {
    return new Response('Recording not ready after retries', { status: 504 });
  }

  try {
    const audioRes = await fetch(rawUrl, {
      headers: {
        Authorization: authHeader
      }
    });

    if (!audioRes.ok) {
      const errText = await audioRes.text();
      return new Response(errText, {
        status: audioRes.status,
        headers: { 'Content-Type': 'application/xml' },
      });
    }

    return new Response(audioRes.body, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    console.error('Fetch audio error:', err);
    return new Response('Failed to fetch Twilio recording.', { status: 500 });
  }
}

async function waitForRecordingToBeReady(recordingSid, authHeader, maxRetries = 6, delay = 2000) {
  const statusUrl = `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Recordings/${recordingSid}.json`;

  for (let i = 0; i < maxRetries; i++) {
    const res = await fetch(statusUrl, {
      headers: { Authorization: authHeader }
    });

    if (res.ok) {
      const data = await res.json();
      if (data.status === 'completed' || data.duration > 0) {
        return true;
      }
    }

    await new Promise(r => setTimeout(r, delay));
  }

  return false;
}

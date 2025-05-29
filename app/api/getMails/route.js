import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { messageIds } = await req.json();
    const accessToken = req.headers.get('authorization')?.replace('Bearer ', '');

    if (!accessToken) {
      return NextResponse.json({ error: 'Missing access token' }, { status: 401 });
    }

    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      return NextResponse.json({ error: 'messageIds must be a non-empty array' }, { status: 400 });
    }

    const results = await Promise.all(
      messageIds.map(async (id) => {
        const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json'
          }
        });

        if (!res.ok) {
          return { id, error: `Failed to fetch: ${res.status}` };
        }

        const data = await res.json();
        return { id, data };
      })
    );

    return NextResponse.json({ messages: results });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error', details: err.message }, { status: 500 });
  }
}

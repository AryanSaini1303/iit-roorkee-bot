import { NextResponse } from 'next/server';

export const config = {
  api: {
    bodyParser: false, // keep this for FormData
  },
};

export async function POST(req) {
  try {
    // Convert the request to a Blob so we can pipe it
    const body = await req.arrayBuffer(); // get raw bytes
    const response = await fetch(`${process.env.PUBLIC_API_URL}/add`, {
      method: 'POST',
      body: body, // pass raw bytes
      headers: {
        // Keep original content-type from client
        'Content-Type': req.headers.get('content-type'),
      },
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: 'Upload failed', details: err.message },
      { status: 500 },
    );
  }
}

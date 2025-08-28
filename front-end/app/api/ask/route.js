// app/api/ask/route.js
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json();

    const response = await fetch(`${process.env.PUBLIC_API_URL}/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to fetch backend', details: err.message },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    const response = await fetch(`${process.env.PUBLIC_API_URL}/ask`);
    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to fetch backend', details: err.message },
      { status: 500 }
    );
  }
}

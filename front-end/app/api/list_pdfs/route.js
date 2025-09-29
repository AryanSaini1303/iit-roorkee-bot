import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const origin = searchParams.get('origin');
    // console.log(origin);
    const response = await fetch(`${process.env.PUBLIC_API_URL}/list-pdfs`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', 'X-Origin': origin },
    });

    const data = await response.json();
    // console.log(data);
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to fetch pdfs', details: err.message },
      { status: 500 },
    );
  }
}

import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch(`${process.env.PUBLIC_API_URL}/list-pdfs`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await response.json();
    // console.log(data);
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to fetch pdfs', details: err.message },
      { status: 500 }
    );
  }
}
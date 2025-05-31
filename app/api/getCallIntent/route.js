import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  const { userInput } = await req.json();

  if (!userInput) {
    return NextResponse.json({ error: 'Missing userInput' }, { status: 400 });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1',
      temperature: 0,
      messages: [
        {
          role: 'system',
          content: `You are an AI that only replies with a JSON object indicating whether the user wants to make a phone call.
            Only reply with: { "result": true } or { "result": false }.
            Do not explain anything.`,
        },
        {
          role: 'user',
          content: userInput,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim() || '';

    try {
      const parsed = JSON.parse(raw);
      return NextResponse.json(parsed);
    } catch (err) {
      return NextResponse.json(
        { error: 'AI response could not be parsed', raw },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error('OpenAI API error:', error);
    return NextResponse.json(
      { error: 'Failed to process intent' },
      { status: 500 },
    );
  }
}

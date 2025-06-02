import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  const { userInput, lang } = await req.json();

  if (!userInput) {
    return NextResponse.json({ error: 'Missing userInput' }, { status: 400 });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0,
      messages: [
        {
          role: 'system',
          content: `You are an AI that decides if the user wants to make a phone call **based on the current message**, even if it's a short confirmation like "yes", "sure", "okay". 
          The language is ${lang}. Only return: { "result": true } or { "result": false }. Never explain.`,
        },
        {
          role: 'user',
          content: userInput,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim() || '';
    // console.log(raw);

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

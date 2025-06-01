import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const { userInput, lang } = await req.json();
    // console.log(userInput);
    const systemPrompt = `
        You are an intent classifier assistant. Your job is to analyze a user's response and The user's response is in this language: ${lang}. Classify their intent into one of the following three categories:
        - "confirm": The user agrees to send the email.
        - "decline": The user does NOT want to send the email.
        - "unknown": The user's input is ambiguous or unrelated.
        Respond with only one word: "confirm", "decline", or "unknown".
    `;
    const chatCompletion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userInput },
      ],
    });
    const intent = chatCompletion.choices[0].message.content
      .trim()
      .toLowerCase();
    return NextResponse.json({ intent });
  } catch (error) {
    console.error('Intent detection error:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Failed to detect intent' }),
      { status: 500 },
    );
  }
}

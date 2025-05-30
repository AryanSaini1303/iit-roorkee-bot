import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // ensure it's set in env
});

export async function POST(req) {
  const { userInput } = await req.json();

  const prompt = `
    You are a message extractor.
    Extract the following two fields from the user's input:
    - "to": the recipient's phone number (in international format) or the recipient's name if no number is found.
    - "message": the actual message the user wants to send.

    If either is missing or unclear, return null for that field.

    Respond only with valid JSON:
    { "to": "<number or name or null>", "message": "<message or null>" }

    Example:
    Input: "Send a WhatsApp message to Aryan saying hello, how are you?"
    → Output: { "to": "Aryan", "message": "hello, how are you?" }

    Input: "Send a WhatsApp to +12025550123 saying hey boss!"
    → Output: { "to": "+12025550123", "message": "hey boss!" }

    Now extract from:
    "${userInput}"
`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content:
          'You extract WhatsApp message data from user input as structured JSON.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0,
  });

  const reply = completion.choices[0]?.message?.content || '{}';

  try {
    const extracted = JSON.parse(reply);
    return NextResponse.json({ success: true, data: extracted });
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: 'Failed to parse response from OpenAI',
    });
  }
}

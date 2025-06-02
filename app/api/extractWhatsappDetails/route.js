import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // ensure it's set
});

export async function POST(req) {
  const { convo, lang } = await req.json();

  if (!Array.isArray(convo) || convo.length === 0) {
    return NextResponse.json({ error: 'Missing convo' }, { status: 400 });
  }

  const systemPrompt = `
    You are a message extractor.
    The user's latest input is in language: ${lang}.

    Extract the following two fields from the user's latest input:
    - "to": the recipient's phone number (in international format) or name, if no number is found. This must never be "him", "her", etc.
    - "message": the actual message the user wants to send.

    Return valid JSON in this format:
    { "to": "<number or name or null>", "message": "<message or null>" }

    🧠 Interpret pronouns like "him" or "her" based on prior context (e.g., if a name was mentioned earlier).
    📌 If either field is missing or ambiguous, return null for it.
    ❌ No explanation, no extra text. Just the JSON.
  `;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...convo.map((msg) => ({
      role: msg.role,
      content: msg.content,
    })),
  ];

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages,
    temperature: 0,
  });

  let reply = completion.choices[0]?.message?.content?.trim();
  if (reply.startsWith('```')) {
    reply = reply
      .replace(/```(?:json)?\n?/, '')
      .replace(/```$/, '')
      .trim();
  }

  try {
    const extracted = JSON.parse(reply);
    // console.log(extracted);
    return NextResponse.json({ success: true, data: extracted });
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: 'Failed to parse JSON from OpenAI',
      raw: reply,
    });
  }
}

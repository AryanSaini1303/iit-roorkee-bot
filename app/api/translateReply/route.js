import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req) {
  try {
    const body = await req.json();
    const { reply, lang } = body;

    if (!reply || !lang) {
      return NextResponse.json(
        { error: 'Missing reply or lang' },
        { status: 400 },
      );
    }

    const systemPrompt = `
      You are a multilingual assistant.
      Given the conversation history and a system-generated reply, translate the reply into ${lang}.
      Do not translate names, places, or technical terms unnecessarily.
      If the ${lang} is English, return the reply as-is.
      Reply only with the translated text without any additional commentary.
    `;

    const openaiResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Please translate this message into ${lang}: "${reply}"`,
        },
      ],
      temperature: 0.3,
    });

    const translatedReply = openaiResponse.choices[0].message.content.trim();

    return NextResponse.json({ translatedReply });
  } catch (error) {
    console.error('Translation Error:', error.message);
    return NextResponse.json({ error: 'Translation failed' }, { status: 500 });
  }
}

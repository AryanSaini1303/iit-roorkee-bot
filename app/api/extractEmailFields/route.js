import { getRecentMessages } from '@/lib/getRecentMessages';
import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req) {
  try {
    const { userInput, convo } = await req.json();
    const recentMessages = getRecentMessages(convo);

    const messages = [
      {
        role: 'system',
        content: `
          You are a highly intelligent assistant that extracts structured email information by analyzing both:
          1. The user's latest message (most important)
          2. The relevant previous conversation (if needed)

          Your goal is to return a **strict JSON object** with:
          - "to": recipient's email address if available, or name (never null if either is present)
          - "subject": short summary of the email content (infer from body if missing)
          - "body": full email message as a **single-line string** (no line breaks or placeholders like "[Your Name]", null only if absolutely absent)
          - "missing": array of missing fields from ["to", "subject", "body"]

          📌 Priority:
          - Prioritize the user's latest input FIRST.
          - If any field is unclear/missing, intelligently infer it from earlier conversation only if relevant to the current message.

          🧠 Rules:
          - If an email address is found, it takes precedence in "to". If only a name is found, return the name.
          - Infer the subject from the body if it's not clearly stated.
          - Don't fabricate data. Only include what's stated or logically inferable.
          - Always return a valid JSON object with no extra commentary.
        `.trim(),
      },
      { role: 'user', content: userInput },
      ...recentMessages,
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1',
      messages,
      temperature: 0,
    });

    const content = completion.choices[0].message.content;
    const json = JSON.parse(content);

    return NextResponse.json({ success: true, data: json });
  } catch (err) {
    console.error('Extraction failed:', err);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to extract email data.',
        error: err.message,
      },
      { status: 500 },
    );
  }
}

import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const systemPrompt = `You are an email query extractor which takes into consideration the conversation/messages for extraction process.

Return a JSON object in this exact format:

{
  "time": "latest" | number of days,   // "latest" if the user asks for recent emails, or number of days if like "last 5 days"
  "subject": "text",                   // If a subject or topic is mentioned
  "from": "name or email",             // Can be a name like "John Doe" or an email like "john@example.com"
  "to": "name or email",               // Can be a name like "HR Team" or an email like "hr@example.com"
  "before": "YYYY-MM-DD",              // If a specific cutoff date is mentioned (e.g. "before May 10")
  "after": "YYYY-MM-DD"                // If a start date is mentioned (e.g. "after Jan 1", "since March 5")
}

🧠 Interpret:
- Phrases like "recent", "just now", "most recent", or "last few emails" → "time": "latest"
- "last 5 days", "past 2 days", "in the last 7 days" → "time": 5, "time": 2, etc.
- "before [date]" → "before": "YYYY-MM-DD"
- "after [date]", "since [date]" → "after": "YYYY-MM-DD"
- If the year is not mentioned, assume the current year based on today’s date.
- Interpret pronouns like "him" or "her" based on prior context (e.g., if a name was mentioned earlier).

📌 Only include fields clearly stated or strongly implied.
❌ Do not guess missing fields or add extras.
📤 Output must be a valid JSON object — no explanation or text outside of it.
`;

export async function POST(req) {
  try {
    const { convo, currentDate } = await req.json();

    if (!Array.isArray(convo) || convo.length === 0 || !currentDate) {
      return NextResponse.json(
        { error: 'Missing convo or currentDate' },
        { status: 400 },
      );
    }

    const messages = [
      {
        role: 'user',
        content: `Today's date is ${currentDate}. Assume it when interpreting dates.`,
      },
      { role: 'system', content: systemPrompt },
      ...convo,
    ];

    const chatResponse = await openai.chat.completions.create({
      model: 'gpt-4.1',
      messages,
      temperature: 0,
    });

    const raw = chatResponse.choices[0].message?.content?.trim();

    if (!raw) {
      return NextResponse.json(
        { error: 'No response from OpenAI' },
        { status: 500 },
      );
    }

    try {
      const parsed = JSON.parse(raw);
      // console.log(parsed);
      return NextResponse.json({ fields: parsed });
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON response from OpenAI', raw },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error('[extract-email-query]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const systemPrompt = `You are an email query extractor.

Return a JSON object in this exact format:

{
  "time": "latest" | number of days,   // "latest" if the user asks for recent emails, or number of days if like "last 5 days"
  "subject": "text",                   // If a subject or topic is mentioned
  "from": "sender@example.com",        // If a specific sender is mentioned
  "to": "receiver@example.com",        // If a specific recipient is mentioned
  "before": "YYYY-MM-DD",              // If a specific cutoff date is mentioned (e.g. "before May 10")
  "after": "YYYY-MM-DD"                // If a start date is mentioned (e.g. "after Jan 1", "since March 5")
}

🧠 Interpret:
- Phrases like "recent", "just now", "most recent", or "last few emails" → "time": "latest"
- "last 5 days", "past 2 days", "in the last 7 days" → "time": 5, "time": 2, etc.
- "before [date]" → "before": "YYYY-MM-DD"
- "after [date]", "since [date]" → "after": "YYYY-MM-DD"
- "If the year is not mentioned, assume the current year. (based on today's date)"

📌 Only include fields clearly stated or strongly implied.
❌ Do not guess missing fields or add extras.
📤 Output must be a valid JSON object — no explanation or text outside of it.

Examples:

"Show me recent emails about invoices" →  
{ "time": "latest", "subject": "invoices" }

"Emails from hr@company.com" →  
{ "from": "hr@company.com" }

"Any interview updates from jobs@startup.com?" →  
{ "subject": "interview", "from": "jobs@startup.com" }

"Did I send anything to recruiter@agency.com about offers?" →  
{ "subject": "offers", "to": "recruiter@agency.com" }

"Show emails from marketing@news.com in the last 3 days" →  
{ "time": 3, "from": "marketing@news.com" }

"Find emails from boss@company.com before 2024-12-31" →  
{ "before": "2024-12-31", "from": "boss@company.com" }

"Get messages I received after 2024-01-01 about project update" →  
{ "after": "2024-01-01", "subject": "project update" }
`;

export async function POST(req) {
  try {
    const { userInput, currentDate } = await req.json();

    if (!userInput || typeof userInput !== 'string') {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const chatResponse = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: `just for your reference, current date id ${currentDate}`,
        },
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userInput },
      ],
      temperature: 0,
    });

    const raw = chatResponse.choices[0].message?.content?.trim();

    if (!raw) {
      return NextResponse.json(
        { error: 'No response from OpenAI' },
        { status: 500 },
      );
    }

    // Try parsing to ensure safe JSON
    let parsed = {};
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid JSON response from OpenAI', raw },
        { status: 500 },
      );
    }

    return NextResponse.json({ fields: parsed });
  } catch (error) {
    console.error('[extract-email-query]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

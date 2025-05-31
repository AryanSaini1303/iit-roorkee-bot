import { getRecentMessages } from '@/lib/getRecentMessages';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req) {
  try {
    const { name, convo } = await req.json();

    if (!convo || !Array.isArray(convo)) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid convo array' }),
        { status: 400 },
      );
    }

    const systemPrompt = `
      You are a call assistant API. Given the entire conversation below, extract structured call info:
      
      1. "to" → If the conversation includes a phone number, it must be a valid E.164 formatted number (e.g., +14155552671).
         Otherwise, extract the name of the person (e.g., "Riya", "Dad", "Doctor").
      
      2. "message" → A polite, natural message phrased from Eva’s voice in third person, always following this template:
      
      "Hi, this is Eva, ${name}'s personal assistant. This call may be recorded for their reference. ${name} would like to [talk to you about / ask you about / know about] [insert topic phrased about the callee]."
      
      Notes:
      - Use "their" instead of gendered pronouns.
      - Choose the verb phrase naturally based on the context.
      - Phrase the topic addressing the callee, e.g., "your health" or "your recent progress."
      - Do not fabricate phone numbers or country codes.
      - If the number format is invalid, return "to": null and include an "error" field describing the issue.
      - Interpret pronouns like "him" or "her" based on prior context (e.g., if a name was mentioned earlier).
      
      Return JSON only, like this:
      
      {
        "to": "name or phone number (E.164 format or name)",
        "message": "formatted message here",
        "error": "optional error message if number is invalid"
      }
      
      Respond with valid JSON only — no extra text.
    `.trim();

    const messages = [
      { role: 'system', content: systemPrompt },
      ...getRecentMessages(convo),
    ];

    const response = await openai.chat.completions.create({
      model: 'gpt-4.1',
      messages,
      temperature: 0.4,
    });

    const raw = response.choices[0].message.content || '';

    // Extract JSON object from response text safely
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) {
      return new Response(
        JSON.stringify({
          error: 'Could not parse call data from OpenAI response',
        }),
        { status: 500 },
      );
    }

    const parsed = JSON.parse(match[0]);

    return new Response(JSON.stringify(parsed), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err) {
    console.error('Extraction error:', err);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
    });
  }
}

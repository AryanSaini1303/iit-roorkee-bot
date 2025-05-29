import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req) {
  try {
    const { userInput, name } = await req.json();

    if (!userInput || typeof userInput !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid userInput' }),
        { status: 400 },
      );
    }

    const prompt = `
        You are a call assistant API. Given a user's instruction to make a phone call, extract:
        
        1. "to" → If the user provides a phone number, it must be a valid E.164 formatted number (e.g., +14155552671).
           - If no number is provided, extract the name of the person (e.g., "Riya", "Dad", "Doctor").
        
        2. "message" → A polite, natural message phrased from Eva’s voice in third person, always following this template:
        
        "Hi, this is Eva, ${name}'s personal AI assistant. This call maybe recorded for his reference. ${name} would like to [talk to you about / ask you about / know about] [insert topic phrased about the callee]."
        
        Notes:
        - This call maybe recorded for his reference.
        - Choose the verb phrase ("talk to you about", "ask you about", or "know about") naturally based on the context of the topic.
        - Phrase the topic addressing the callee, e.g., "your health" or "your recent progress."
        - Avoid first-person "I" or ambiguous pronouns.
        - Extract the topic clearly from the user input.
        - Include the country code in numbers only if explicitly provided.
        - Do not fabricate phone numbers or country codes.
        - If the number format is invalid, return "to": null and include an "error" field describing the issue.
        
        Return JSON only, like this:
        
        {
          "to": "name or phone number (E.164 format or name)",
          "message": "formatted message here",
          "error": "optional error message if number is invalid"
        }
        
        Input: """${userInput}"""
        
        Respond with valid JSON only — no extra text.
    `.trim();

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
    });

    const raw = response.choices[0].message.content || '';

    // Optional: Validate and clean
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

import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const vagueTerms = ['my home', 'current location', 'here', 'my place'];

export async function POST(req) {
  try {
    const { convo } = await req.json();

    if (!convo || !Array.isArray(convo) || convo.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing or invalid convo array',
        }),
        { status: 400 },
      );
    }

    const systemPrompt = `
      You are a cab booking assistant.

      Your task is to extract two fields from the user conversation:
      - "origin": where the ride starts
      - "destination": where the ride ends

      Instructions:
      - Prioritize the latest message in the conversation.
      - If origin or destination is vague (e.g., ${vagueTerms.join(
        ', ',
      )}), treat it as missing.
      - Use earlier messages only if the latest message lacks clarity.
      - Do not fabricate or guess unclear values.

      Return JSON in this exact format:
      {
        "origin": string | null,
        "destination": string | null,
        "missing": [ "origin" | "destination" ]
      }
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-4.1',
      messages: [{ role: 'system', content: systemPrompt }, ...convo],
      temperature: 0,
    });

    let data;
    try {
      data = JSON.parse(response.choices[0].message.content.trim());
    } catch {
      data = {
        origin: null,
        destination: null,
        missing: ['origin', 'destination'],
      };
    }

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to extract cab fields' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}

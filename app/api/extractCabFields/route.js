import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const vagueTerms = ['my home', 'current location', 'here', 'my place'];

export async function POST(req) {
  try {
    const { message } = await req.json();
    const prompt = `
        Extract origin and destination from this text for a cab booking.
        If origin or destination is vague (e.g. ${vagueTerms.join(
          ', ',
        )}), treat it as missing.

        Reply ONLY with JSON:
        {
          "origin": string|null,
          "destination": string|null,
          "missing": [ "origin" | "destination" ]
        }

        Text: """${message}"""
        `;
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content:
            'You extract origin and destination for cab bookings. Vague locations are missing.',
        },
        { role: 'user', content: prompt },
      ],
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

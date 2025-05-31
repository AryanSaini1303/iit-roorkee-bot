import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req) {
  try {
    const body = await req.json();
    const { convo } = body;

    if (!Array.isArray(convo) || convo.length === 0) {
      return new Response(JSON.stringify({ error: 'Missing conversation' }), {
        status: 400,
      });
    }

    const recentContext = convo.slice(0, -1); // prior context
    const latestMessage = convo[convo.length - 1]; // current message

    const response = await openai.chat.completions.create({
      model: 'gpt-4.1',
      temperature: 0,
      messages: [
        {
          role: 'system',
          content: `You are an intent classifier.

            Given the user's latest input and optional prior context, classify the user's intent as one of the following:

            chat, send_email, book_cab, make_call, check_mail, send_whatsapp_message

            🧠 Definitions:
            chat – general talk, questions, jokes, hypotheticals, or exploratory requests  
            send_email – user wants to write/send an email now  
            book_cab – user wants a ride or cab now  
            make_call – user wants to call someone now  
            check_mail – user wants to check inbox, read or filter emails now  
            send_whatsapp_message – user wants to send a WhatsApp message or text someone now

            ✅ Use action intents (send_email, make_call, etc.) **only if the user clearly wants to do it now**  
            ❌ Do NOT respond to the user's message. Only classify intent.

            📤 Respond with just one of: chat, send_email, book_cab, make_call, check_mail, send_whatsapp_message
          `,
        },
        ...recentContext,
        {
          role: 'user',
          content: `Classify this message only: "${latestMessage.content}"`,
        },
      ],
    });

    const intent = response.choices[0].message.content.trim().toLowerCase();

    return new Response(JSON.stringify({ intent }));
  } catch (error) {
    console.error('Intent classification error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to classify intent' }),
      {
        status: 500,
      },
    );
  }
}

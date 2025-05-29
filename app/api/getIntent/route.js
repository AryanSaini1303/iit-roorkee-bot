import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req) {
  try {
    const body = await req.json();
    const { message } = body;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are an intent classifier. Classify the user's intent as one of:

            chat: general talk, questions, or hypotheticals
                  
            send_email: clear intent to send or draft an email now
                  
            book_cab: clear intent to book a cab or ride now
                  
            make_call: clear intent to initiate a phone call or talk to someone now
                  
          Rules:
          - Only classify as make_call if the user **clearly wants to initiate a call right now**.
          - If the input is a **question, hypothetical, or curiosity**, classify it as chat — even if it mentions calling.
          - Treat indirect phrases like "talk to", "speak with", or "call [name]" as make_call **only when they express a current action or command**.
                  
          Examples:
          ✅ "Call Aryan now" → make_call  
          ✅ "I want to talk to Aryan Saini" → make_call  
          ✅ "Send a mail to my professor" → send_email  
          ✅ "Book a cab to the airport" → book_cab  
          ✅ "Did you just call someone?" → chat  
          ✅ "Can you call people?" → chat  
          ✅ "How do I send an email?" → chat  
          ❌ Don't classify **questions or what-if scenarios** as send_email, make_call, or book_cab.
                  
          Respond with only: chat, send_email, book_cab, or make_call.
        `,
        },
        {
          role: 'user',
          content: message,
        },
      ],
    });

    const intent = response.choices[0].message.content.trim().toLowerCase();
    // console.log(intent);
    return intent && Response.json({ intent });
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

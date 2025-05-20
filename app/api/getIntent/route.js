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
          content: `You are an intent classifier. Classify the user's message as one of:

          - "chat" → questions, general talk, hypotheticals, or meta-discussion  
          - "send_email" → if the user clearly wants to send or draft an email now  
          - "book_cab" → if the user clearly wants to book a cab/ride now
                  
          ❗ Only classify as "send_email" or "book_cab" if the command is clear and actionable **right now**.
                  
          Examples:
                  
          ✅ send_email:  
          - "Send an email to my boss" → send_email  
          - "Draft a mail saying I'm sick" → send_email  
                  
          ❌ chat:  
          - "How to send email?"  
          - "Can you send emails?"
                  
          ✅ book_cab:  
          - "Book a cab from Delhi to Gurgaon" → book_cab  
          - "Call an Uber to my house" → book_cab  
                  
          ❌ chat:  
          - "Can you book rides?"  
          - "How do I book a cab?"
                  
          Respond with just: "chat", "send_email", or "book_cab"`,
        },
        {
          role: 'user',
          content: message,
        },
      ],
    });

    const intent = response.choices[0].message.content.trim().toLowerCase();
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
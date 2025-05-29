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

            chat – general talk, questions, or hypotheticals
                    
            send_email – clear intent to send or draft an email now
                    
            book_cab – clear intent to book a cab or ride now
                    
            make_call – clear intent to initiate a call or speak with someone now
                    
            check_mail – clear intent to view emails (by sender, subject, or latest)
                    
            Rules:
                    
            Use make_call, send_email, or check_mail only if the user wants to do it now.
                    
            Use chat for questions, hypotheticals, or general talk, even if they mention calls, mails, etc.
                    
            Use check_mail for prompts like: “show emails from Aryan”, “check inbox for latest”, “get mails with subject X”.
                    
            Examples:
                    
            "Send a mail to my professor" → send_email
                    
            "Check if I got mail from Aryan" → check_mail
                    
            "Book a cab to the airport" → book_cab
                    
            "Call Aryan now" → make_call
                    
            "Can you send emails?" → chat
                    
            Respond with one of: chat, send_email, book_cab, make_call, check_mail.`,
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

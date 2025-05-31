import { getRecentMessages } from '@/lib/getRecentMessages';
import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req) {
  try {
    const body = await req.json();
    const { message, convo } = body;
    // console.log(...getRecentMessages(convo));
    const response = await openai.chat.completions.create({
      model: 'gpt-4.1',
      messages: [
        {
          role: 'system',
          content: `You are an intent classifier. Given the user's latest input and optional prior context, classify the user's intent as one of: chat, send_email, book_cab, make_call, check_mail, send_whatsapp_message

            chat – questions, hypotheticals, or general talk (even if they mention send mail, call, cab, or WhatsApp)  
            send_email – user clearly wants to send or write an email now  
            book_cab – user wants to book a cab or ride now  
            make_call – user wants to call or speak to someone now  
            check_mail – user wants to check inbox, view latest, or filter mails  
            send_whatsapp_message – user wants to send a WhatsApp message now

            Only use send_email, make_call, check_mail, book_cab, or send_whatsapp_message if the user wants to do it **now**. Else, use chat.

            Examples:  
            "Send a mail to my professor" → send_email  
            "Send a mail to aryan" → send_email  
            "Check if I got mail from Aryan" → check_mail  
            "Book a cab to the airport" → book_cab  
            "Call Aryan now" → make_call  
            "Message mom on WhatsApp" → send_whatsapp_message  
            "Can you send WhatsApp messages?" → chat

            Respond with only one of: chat, send_email, book_cab, make_call, check_mail, send_whatsapp_message.
          `,
        },
        ...getRecentMessages(convo),
        // {
        //   role: 'user',
        //   content: message,
        // },
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

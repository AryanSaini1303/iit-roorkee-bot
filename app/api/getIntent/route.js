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
          content: `You are an intent classifier. You must classify the user's message into ONE of the following three intents ONLY:

          - "chat" → general conversation, questions, explanations, hypotheticals, or meta-discussion.
          - "send_email" → when the user clearly wants to **send or draft** an actual email now.
          - "order_food" → when the user wants to **place a food order** now.
                  
          ❗️Only classify as "send_email" or "order_food" if the user is giving a **clear, direct command or request** to do it right now.
                  
          ---
          Special Rules:
          - If the message is a **question, hypothetical, or meta-statement** (e.g. "what if", "what will you do", "how to", "can you"), classify it as **"chat"**.
          - Do **not** assume intent based on keywords alone — understand the user’s actual purpose.
                  
          ---
          Examples:
                  
          ✅ Send Email:
          - "Send an email to John about the meeting" → send_email
          - "Draft a mail saying I’ll be late" → send_email
                  
          ❌ Not Send Email (Chat):
          - "How do I send an email?" → chat
          - "Can you send emails?" → chat
          - "What will you do if I say 'send an email to my friend'?" → chat
          - "Do you know how to email using Gmail?" → chat
          - "I was thinking about sending an email" → chat
                  
          ✅ Order Food:
          - "Order a large pizza with mushrooms" → order_food
                  
          ❌ Not Order Food (Chat):
          - "How do you order food online?" → chat
          - "What if I said I wanted biryani?" → chat
                  
          Respond with ONLY: "chat", "send_email", or "order_food". No explanation.`,
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

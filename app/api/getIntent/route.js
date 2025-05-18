import { OpenAI } from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req) {
  try {
    const body = await req.json();
    const { message } = body;
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are an intent classifier. Classify the user input as one of the following: chat, send_email, order_food. Respond with only the intent name.",
        },
        {
          role: "user",
          content: message,
        },
      ],
    });
    // console.log(response.choices[0].message.content.trim().toLowerCase());
    const intent = response.choices[0].message.content.trim().toLowerCase();
    return intent && Response.json({ intent });
  } catch (error) {
    console.error("Intent classification error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to classify intent" }),
      {
        status: 500,
      }
    );
  }
}

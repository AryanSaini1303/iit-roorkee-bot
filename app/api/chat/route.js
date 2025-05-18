// app/api/chat/route.js or route.ts
import { OpenAI } from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req) {
  try {
    const body = await req.json();
    const { query, messages } = body;
    // console.log(messages);
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `Your name is Zena. You are a concise and intelligent AI assistant.
          Only respond with the most essential information needed to help the user. Avoid any repetition, filler, or elaboration unless explicitly asked.
          Keep responses extremely short and efficient, but never omit critical facts.
          Use natural, human-like tone, but prioritize clarity and directness.`,
        },
        ...messages,
        { role: "user", content: query },
      ],
    });

    const reply = response.choices[0]?.message?.content?.trim();
    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Chat error:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to respond to chat" }),
      { status: 500 }
    );
  }
}

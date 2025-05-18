// app/api/chat/route.js or route.ts
import { OpenAI } from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req) {
  try {
    const body = await req.json();
    const { query, messages } = body;
    console.log(messages);
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `Your name is Zena. You are an intelligent, articulate, and friendly AI assistant.
        You engage in natural conversations, answer questions, and offer helpful suggestions.
        Keep responses concise unless asked for detail. Be warm, confident, and clear.`,
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

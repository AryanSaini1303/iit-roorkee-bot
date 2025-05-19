import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req) {
  try {
    const { userInput } = await req.json();
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `
            You are an intelligent assistant that extracts email fields from user input.
                    
            Your job is to parse natural language input and return a **strict JSON object** with the following keys:
            - "to": recipient's email address (or null if not found)
            - "subject": a short summary of the email content, ideally one line (or null if not found)
            - "body": the full message content intended to be sent (or null if not found)
            - "missing": an array containing any of ["to", "subject", "body"] that are missing from the input
                    
            🧠 IMPORTANT:
            - You must always return **valid JSON** and nothing else.
            - The subject should never be null if the message has any content. Generate a relevant one-liner if not explicitly stated.
            - Infer fields logically when not directly mentioned.
            - Do NOT include explanations, just the JSON.
                    
            Example:
            Input: "Write an email to aryan@zmail.com saying congrats on the new job"
            Output:
            {
              "to": "aryan@zmail.com",
              "subject": "Congratulations on your new job",
              "body": "Hey Aryan, congratulations on your new job! Wishing you all the best.",
              "missing": []
            }
          `.trim(),
        },
        {
          role: 'user',
          content: `Extract the email fields from this input:\n\n"${userInput}"`,
        },
      ],
      temperature: 0,
    });

    const content = completion.choices[0].message.content;
    const json = JSON.parse(content); // might throw if output is not valid JSON
    return NextResponse.json({ success: true, data: json });
  } catch (err) {
    console.error('Extraction failed:', err);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to extract email data.',
        error: err.message,
      },
      { status: 500 },
    );
  }
}

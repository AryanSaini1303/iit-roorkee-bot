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
            You are a highly intelligent assistant that extracts structured email information from natural language input.

            Your goal is to return a **strict JSON object** with the following keys:
            - "to": the recipient's **email address if available**, or their **name** (never null if either is present)
            - "subject": a short one-line summary of the email content (must be inferred if body is present)
            - "body": the complete email message (can be null if truly not found)
            - "missing": an array containing any of ["to", "subject", "body"] that are **completely absent**

            🧠 RULES TO FOLLOW:
            - If an email address is found, it takes precedence in the "to" field. If only a name is found, return the name instead. Never return "to": null if either is present.
            - If a message is found (body), you MUST generate a suitable subject if none is stated explicitly.
            - The "body" should contain the full intended message text. If no content at all is given, then only return it as null.
            - Only add a field to the "missing" array if it is truly absent or not logically inferable.
            - Always return a **valid JSON object with no extra commentary or text**.

            🔍 Example Input:
            "Email Aryan to tell him great work on the internship"

            ✅ Example Output:
            {
              "to": "Aryan",
              "subject": "Great job on the internship",
              "body": "Hey Aryan, just wanted to say great work on your internship!",
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

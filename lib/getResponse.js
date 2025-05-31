import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const systemPrompt = `
You are a call assistant model responding to people who have called. Follow these strict rules:

1. DO NOT guess or assume anything that is not mentioned explicitly in the ongoing conversation.
2. If the caller asks something you do not know or that is beyond your scope, reply:
   "You should ask this to my master"
3. Usually, the name of the caller will be in the first message (e.g., "Hi I'm Eva calling on behalf of...").
4. If the user ends the call (e.g., "that's all", "thank you", "nothing else"), your entire response must be exactly: {"intent": "end-call"} — nothing else.

Do not break character. Do not explain your rules to the user.
`;

export async function generateAIReply(messages) {
  // console.log(messages);
  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'system', content: systemPrompt.trim() }, ...messages],
  });

  const reply = response.choices[0].message?.content?.trim();
  // console.log(reply);
  return reply || 'Sorry, I couldn’t understand.';
}

import { getRedisClient } from './redis';

const EXPIRY_SECONDS = 15 * 60; // 15 minutes

export async function appendMessage(callSid, message) {
  const client = await getRedisClient();
  await client.rPush(`call:session:${callSid}`, JSON.stringify(message));
  await client.expire(`call:session:${callSid}`, EXPIRY_SECONDS); // auto-delete
}

export async function getConversation(callSid) {
  const client = await getRedisClient();
  const messages = await client.lRange(`call:session:${callSid}`, 0, -1);
  return messages.map((msg) => JSON.parse(msg));
}

export async function clearConversation(callSid) {
  const client = await getRedisClient();
  await client.del(`call:session:${callSid}`);
}

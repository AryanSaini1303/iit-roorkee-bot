export function getRecentMessages(messages, max = 40) {
  return messages?.slice(-max) || [];
}

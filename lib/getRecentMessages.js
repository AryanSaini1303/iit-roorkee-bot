export function getRecentMessages(messages, max = 20) {
  return messages?.slice(-max) || [];
}

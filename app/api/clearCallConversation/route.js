import { clearConversation, getConversation } from '@/lib/convoStore';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const sid = searchParams.get('sid');

  if (!sid) {
    return NextResponse.json({ error: 'Missing SID' }, { status: 400 });
  }

  await clearConversation(sid);
  return NextResponse.json({ success: true });
}

import { NextResponse } from 'next/server';
import { requireAdmin } from '@/utils/adminAuth';
import { loadWhatsAppData } from '@/utils/whatsappOverview';
import { buildWhatsAppUsers } from '@/utils/whatsappStats';

export async function POST(req) {
  const { origin } = await req.json().catch(() => ({}));
  const auth = await requireAdmin(origin);
  if (!auth.ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { waUsers, conversations } = await loadWhatsAppData();
    return NextResponse.json({ users: buildWhatsAppUsers(waUsers, conversations) });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

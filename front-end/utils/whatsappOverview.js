import { whatsappAdminClient } from '@/utils/supabase/whatsappAdmin';

async function fetchAll(build) {
  const pageSize = 1000;
  const rows = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await build().range(from, from + pageSize - 1);
    if (error) throw error;
    rows.push(...data);
    if (data.length < pageSize) break;
  }
  return rows;
}

export async function loadWhatsAppData() {
  const supabase = whatsappAdminClient();
  const [waUsers, conversations] = await Promise.all([
    fetchAll(() => supabase.from('whatsapp_users').select('*').order('phone_number')),
    fetchAll(() =>
      supabase
        .from('conversations')
        .select('id, phone_number, messages, updated_at')
        .eq('source', 'whatsapp')
        .order('id'),
    ),
  ]);
  return { waUsers, conversations };
}

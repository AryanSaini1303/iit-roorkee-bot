import { createClient } from '@supabase/supabase-js';

export async function POST(req) {
  const { sessionId, origin } = await req.json();
  const supabase = createClient(
    origin === 'CWC'
      ? process.env.SUPABASE_SERVER_URL_CWC
      : process.env.SUPABASE_SERVER_URL_DSA,
    origin === 'CWC'
      ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_CWC
      : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_DSA,
  );
  const { error } = await supabase.from('heartbeats').upsert(
    {
      session_id: sessionId,
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: 'session_id' }, // 👈 tells Postgres how to merge
  );
  if (error) {
    console.error('Heartbeat error:', error);
    return Response.json({ success: false, error });
  }
  return Response.json({ success: true });
}

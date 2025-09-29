import { createClient } from '@/utils/supabase/server';

export async function POST(req) {
  const { origin } = await req.json();
  const supabase = await createClient(origin === 'CWC' ? 'CWC' : 'DSA');
  try {
    const { count, error } = await supabase
      .from('visits')
      .select('*', { count: 'exact', head: true });
    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }
    return Response.json({ count }, { status: 200 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

import { createClient } from '@/utils/supabase/server';

export async function POST(req) {
  const { origin } = await req.json();
  const supabase = await createClient(origin === 'CWC' ? 'CWC' : 'DSA');
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('name, num');
    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }
    return Response.json({ data }, { status: 200 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

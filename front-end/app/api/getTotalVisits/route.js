import { createClient } from '@/utils/supabase/server';

export async function GET() {
  const supabase = await createClient();
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

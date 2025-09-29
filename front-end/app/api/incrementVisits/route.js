import { createClient } from '@/utils/supabase/server';

export async function POST(req) {
  const { origin } = await req.json();
  const supabase = await createClient(origin === 'CWC' ? 'CWC' : 'DSA');
  const {
    data: { user },
  } = await supabase.auth.getUser();
  //   console.log(user);

  try {
    const { count } = await supabase
      .from('visits')
      .select('*', { count: 'exact', head: true });
    // console.log(count);
    const { data, error: insertError } = await supabase.from('visits').insert({
      user_id: user.id,
      timestamp: new Date().toISOString(),
    });
    if (insertError) throw insertError;
    return Response.json({ success: true }, { status: 200 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

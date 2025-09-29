import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  const { category, origin } = await request.json();
  const supabase = createClient(
    origin === 'CWC'
      ? process.env.SUPABASE_SERVER_URL_CWC
      : process.env.SUPABASE_SERVER_URL_DSA,
    origin === 'CWC'
      ? process.env.SUPABASE_SERVICE_ROLE_KEY_CWC
      : process.env.SUPABASE_SERVICE_ROLE_KEY_DSA,
  );
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('num')
      .eq('name', category)
      .single();
    // console.log(data);
    if (error) throw error;
    // return NextResponse.json(data)
    const { error: error1 } = await supabase
      .from('categories')
      .update({ num: data.num + 1 })
      .eq('name', category);
    if (error1) throw error1;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

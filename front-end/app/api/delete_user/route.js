import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req) {
  try {
    const { userId, origin } = await req.json();
    const supabase = createClient(
      origin === 'CWC'
        ? process.env.SUPABASE_SERVER_URL_CWC
        : process.env.SUPABASE_SERVER_URL_DSA,
      origin === 'CWC'
        ? process.env.SUPABASE_SERVICE_ROLE_KEY_CWC
        : process.env.SUPABASE_SERVICE_ROLE_KEY_DSA,
    );
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) throw error;

    return NextResponse.json({ status: 'success', deleted: userId });
  } catch (err) {
    console.log(err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

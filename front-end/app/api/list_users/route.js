import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req) {
  const { origin } = await req.json();
  const supabase = createClient(
    origin === 'CWC'
      ? process.env.SUPABASE_SERVER_URL_CWC
      : process.env.SUPABASE_SERVER_URL_DSA,
    origin === 'CWC'
      ? process.env.SUPABASE_SERVICE_ROLE_KEY_CWC
      : process.env.SUPABASE_SERVICE_ROLE_KEY_DSA,
  );
  try {
    const { data, error } = await supabase.auth.admin.listUsers();
    if (error) throw error;
    // console.log(data);
    const users = data.users.map((u) => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      name: u.user_metadata.full_name,
      phone: u.user_metadata.phone,
      organisation: u.user_metadata.organisation,
      designation: u.user_metadata.designation,
    }));
    return NextResponse.json({ users });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

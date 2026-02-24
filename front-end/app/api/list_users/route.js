import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req) {
  const { origin } = await req.json();
  const fetchAllUsers = async (supabase) => {
    let allUsers = [];
    let page = 1;
    const perPage = 100;
    while (true) {
      const { data, error } = await supabase.auth.admin.listUsers({
        page,
        per_page: perPage,
      });
      if (error) throw error;
      allUsers.push(...data.users);
      if (page >= data.lastPage) break;
      page++;
    }
    return allUsers;
  };
  const supabase = createClient(
    origin === 'CWC'
      ? process.env.SUPABASE_SERVER_URL_CWC
      : process.env.SUPABASE_SERVER_URL_DSA,
    origin === 'CWC'
      ? process.env.SUPABASE_SERVICE_ROLE_KEY_CWC
      : process.env.SUPABASE_SERVICE_ROLE_KEY_DSA,
  );
  try {
    const usersData = await fetchAllUsers(supabase);
    const users = usersData.map((u) => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      name: u.user_metadata?.full_name || null,
      phone: u.user_metadata?.phone || null,
      organisation: u.user_metadata?.organisation || null,
      designation: u.user_metadata?.designation || null,
    }));
    return NextResponse.json({ users });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

import { createClient } from '@/utils/supabase/server';

// Server-side twin of the client check used by the admin pages:
// the caller must hold a session on this tenant AND be on the admin list.
export async function requireAdmin(origin) {
  try {
    const supabase = await createClient(origin === 'CWC' ? 'CWC' : 'DSA');
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const allowed = (process.env.NEXT_PUBLIC_ADMIN_ACCESS || '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    if (user?.email && allowed.includes(user.email.toLowerCase())) {
      return { ok: true, user };
    }
  } catch {}
  return { ok: false };
}

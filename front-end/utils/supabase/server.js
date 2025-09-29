import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient(tenant = 'CWC') {
  const cookieStore = await cookies();

  let url, key;

  if (tenant === 'CWC') {
    url = process.env.NEXT_PUBLIC_SUPABASE_URL_CWC;
    key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_CWC;
  } else if (tenant === 'DSA') {
    url = process.env.NEXT_PUBLIC_SUPABASE_URL_DSA;
    key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_DSA;
  }

  if (!url || !key) {
    throw new Error(`Unknown tenant: ${tenant}`);
  }

  return createServerClient(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {}
      },
    },
  });
}

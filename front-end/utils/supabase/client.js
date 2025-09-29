import { createBrowserClient } from '@supabase/ssr';

export function createClient(tenant = 'CWC') {
  if (tenant === 'CWC') {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL_CWC,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_CWC
    );
  }

  if (tenant === 'DSA') {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL_DSA,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_DSA
    );
  }

  throw new Error("Invalid tenant");
}

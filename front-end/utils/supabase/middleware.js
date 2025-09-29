import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

// Define tenant configs
const TENANT_MAP = {
  CWC: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL_CWC,
    key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_CWC,
  },
  DSA: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL_DSA,
    key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_DSA,
  },
};

// Resolve tenant based on URL
function resolveTenant(pathname) {
  if (pathname.startsWith('/CWC')) return { name: 'CWC', ...TENANT_MAP.CWC };
  if (pathname.startsWith('/DSA')) return { name: 'DSA', ...TENANT_MAP.DSA };
  return null;
}

export async function updateSession(request) {
  const supabaseResponse = NextResponse.next({ request });
  const tenant = resolveTenant(request.nextUrl.pathname);

  // Bypass API, static files, and worker scripts
  const bypassPaths = [
    '/api',
    '/sounds',
    '/fonts',
    '/images',
    '/pdf.worker.js',
    '/'
  ];
  if (bypassPaths.some((p) => request.nextUrl.pathname.startsWith(p))) {
    return supabaseResponse;
  }

  // Unknown tenant for non-bypassed pages
  if (!tenant) {
    return NextResponse.json({ error: 'Unknown tenant' }, { status: 403 });
  }

  // Create Supabase server client for the tenant
  const supabase = createServerClient(tenant.url, tenant.key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If no session for this tenant, redirect to tenant home
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = `/${tenant.name}/home`;
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

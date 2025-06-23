import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(req) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  try {
    const { data, error } = await supabase
      .from('limit_counter')
      .select('*')
      .eq('user_id', user?.id);

    if (error) {
      return NextResponse.json({ error: "Can't fetch user!" }, { status: 500 });
    }

    if (data.length === 0) {
      const { error } = await supabase
        .from('limit_counter')
        .insert([{ email: user?.email, query_num: 1, user_id: user?.id }]);

      if (error) {
        return NextResponse.json({ error: 'Insert error' }, { status: 500 });
      }
      return NextResponse.json({ success: true }, { status: 200 });
    } else {
      const date = new Date();
      const { error } = await supabase
        .from('limit_counter')
        .update({
          query_num: data[0].query_num + 1,
          limit_reached_at:
            data[0].query_num + 1 ===
            Number(process.env.NEXT_PUBLIC_QUERY_LIMIT)
              ? date
              : null,
        })
        .eq('user_id', user?.id);

      if (error) {
        return NextResponse.json({ error: 'Update error' }, { status: 500 });
      }

      return NextResponse.json({ success: true }, { status: 200 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}

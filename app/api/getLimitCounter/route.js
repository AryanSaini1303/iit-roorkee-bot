import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  try {
    const { data, error } = await supabase
      .from('limit_counter')
      .select('query_num')
      .eq('user_id', user?.id);
    if (error) {
      return NextResponse.json(
        { error: "Can't fetch current limit!" },
        { status: 500 },
      );
    }
    console.log(data);
    return NextResponse.json({ num: data[0]?.query_num || 0 }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: `Internal Server Error ${error.message}` },
      { status: 500 },
    );
  }
}

import { supabase } from '@/lib/supabaseClient';

export async function POST(req) {
  const formData = await req.formData();
  const callSid = formData.get('CallSid');
  const callStatus = formData.get('CallStatus');
  console.log(callStatus);

  const statusJson = JSON.stringify({
    status: callStatus,
    timestamp: new Date().toISOString(),
  });

  const res = await supabase
    .from('call_status')
    .insert({
      callSid: callSid,
      status: statusJson,
    })
    .select();

  if (res.data.length === 0) {
    return new Response('Failed to update status', { status: 500 });
  }

  return new Response('Status updated', { status: 200 });
}

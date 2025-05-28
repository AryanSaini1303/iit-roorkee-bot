import { supabase } from './supabaseClient';

export async function checkCallStatus(callSid) {
  try {
    const { data, error } = await supabase
      .from('call_status')
      .select('status')
      .eq('callSid', callSid)
      .limit(1);
    console.log(data, error);
    const finalStatus =
      data.length !== 0 ? JSON.parse(data[0]?.status)?.status : 'unknown';
    console.log('finalStatus=> ', finalStatus);
    return { callStatus: finalStatus };
  } catch (error) {
    return { callStatus: 'unknown' };
  }
}
// unhandled exceptions can trigger debugger breakpoints in some environments
// .single() in the query can automatically log error in console when no data is found even if you don't explicitly tell it do it
// .limit(1) returns an empty array if no data is found

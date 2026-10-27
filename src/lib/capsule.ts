import { supabase } from './supabase';

export type Capsule = { id: string; open_on: string; opened_at: string | null; created_at: string; body: string | null; days_ago: number; ready: boolean };

export async function listCapsules(): Promise<Capsule[]> {
  const { data, error } = await supabase.rpc('list_time_capsules');
  if (error) throw error;
  return data;
}
export async function sendCapsule(body: string, days: number, requestId: string): Promise<void> {
  const { error } = await supabase.rpc('send_time_capsule', { p_body: body, p_days: days, p_request_id: requestId });
  if (error) throw error;
}
export async function openCapsule(id: string): Promise<string> {
  const { data, error } = await supabase.rpc('open_time_capsule', { p_id: id });
  if (error) throw error;
  return data;
}

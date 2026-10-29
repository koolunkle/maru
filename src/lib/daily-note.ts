import { supabase } from './supabase';
import type { Tables } from '../types/database';

export const DailyNoteMaxLength = 60;
/** 기분 저장 값 1~5의 문구 (PRD F15) */
export const MoodLabels = ['마음이 가벼워요', '조금 가벼워요', '보통이에요', '조금 무거워요', '마음이 무거워요'] as const;
export type DailyNote = Pick<Tables<'daily_notes'>, 'note_date' | 'mood' | 'text'>;

export async function getDailyNote(userId: string, date: string): Promise<DailyNote | null> {
  const { data, error } = await supabase
    .from('daily_notes')
    .select('note_date, mood, text')
    .eq('user_id', userId)
    .eq('note_date', date)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function saveDailyNote(userId: string, date: string, mood: number, text: string): Promise<DailyNote> {
  if (!userId || !Number.isInteger(mood) || mood < 1 || mood > 5 || text.length > DailyNoteMaxLength) {
    throw new Error('기분과 한 줄을 확인해 주세요');
  }
  const { data, error } = await supabase
    .rpc('save_daily_note', {
      p_user_id: userId,
      p_note_date: date,
      p_mood: mood,
      p_text: text,
    })
    .single();
  if (error) throw error;
  if (!data) throw new Error('기록을 저장하지 못했어요');
  return data;
}

export async function deleteDailyNote(userId: string, date: string): Promise<void> {
  const { error } = await supabase.from('daily_notes').delete().eq('user_id', userId).eq('note_date', date);
  if (error) throw error;
}

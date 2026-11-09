import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Bilingual } from '@/types/catalog';

export interface FlashNews {
  id: string;
  text: Bilingual;
  isActive: boolean;
  isPinned: boolean;
  startsAt: string | null;
  endsAt: string | null;
  textColor: string;
  backgroundColor: string;
  linkUrl: string | null;
  sortOrder: number;
  updatedAt: string;
}

export interface FlashNewsInput {
  textEn: string;
  textHi: string;
  isActive: boolean;
  isPinned: boolean;
  startsAt: string | null;
  endsAt: string | null;
  textColor: string;
  backgroundColor: string;
  linkUrl: string | null;
}

interface FlashNewsRow {
  id: string;
  text: string;
  text_hi: string | null;
  is_active: boolean;
  is_pinned: boolean;
  starts_at: string | null;
  ends_at: string | null;
  text_color: string;
  background_color: string;
  link_url: string | null;
  sort_order: number;
  updated_at: string;
}

const FLASH_NEWS_COLUMNS =
  'id, text, text_hi, is_active, is_pinned, starts_at, ends_at, text_color, background_color, link_url, sort_order, updated_at';

function mapFlashNews(row: FlashNewsRow): FlashNews {
  return {
    id: row.id,
    text: { en: row.text, hi: row.text_hi?.trim() || row.text },
    isActive: row.is_active,
    isPinned: row.is_pinned,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    textColor: row.text_color,
    backgroundColor: row.background_color,
    linkUrl: row.link_url,
    sortOrder: row.sort_order,
    updatedAt: row.updated_at,
  };
}

function toRow(input: FlashNewsInput) {
  return {
    text: input.textEn.trim(),
    text_hi: input.textHi.trim() || null,
    is_active: input.isActive,
    is_pinned: input.isPinned,
    starts_at: input.startsAt,
    ends_at: input.endsAt,
    text_color: input.textColor,
    background_color: input.backgroundColor,
    link_url: input.linkUrl,
  };
}

export async function fetchFlashNews(): Promise<FlashNews[]> {
  const { data, error } = await supabase
    .from('flash_news')
    .select(FLASH_NEWS_COLUMNS)
    .order('is_pinned', { ascending: false })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  if (!Array.isArray(data)) throw new Error('Unexpected flash news data');
  return (data as unknown as FlashNewsRow[]).map(mapFlashNews);
}

export async function createFlashNews(input: FlashNewsInput): Promise<void> {
  const { error } = await supabase.from('flash_news').insert(toRow(input));
  if (error) throw new Error(error.message);
}

export async function updateFlashNews(id: string, input: FlashNewsInput): Promise<void> {
  const { error } = await supabase
    .from('flash_news')
    .update({ ...toRow(input), updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function setFlashNewsFlags(
  id: string,
  flags: { isActive?: boolean; isPinned?: boolean },
): Promise<void> {
  const update: Record<string, boolean | string> = { updated_at: new Date().toISOString() };
  if (flags.isActive !== undefined) update.is_active = flags.isActive;
  if (flags.isPinned !== undefined) update.is_pinned = flags.isPinned;
  const { error } = await supabase.from('flash_news').update(update).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteFlashNews(id: string): Promise<void> {
  const { error } = await supabase.from('flash_news').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export function isFlashNewsLive(item: FlashNews, now: number = Date.now()): boolean {
  if (!item.isActive) return false;
  if (item.startsAt && Date.parse(item.startsAt) > now) return false;
  if (item.endsAt && Date.parse(item.endsAt) <= now) return false;
  return true;
}

export interface ActiveFlashNewsState {
  items: FlashNews[];
  loading: boolean;
  error: string | null;
}

export function useActiveFlashNews(): ActiveFlashNewsState {
  const [items, setItems] = useState<FlashNews[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchFlashNews()
      .then((rows) => {
        if (!active) return;
        setItems(rows.filter((row) => isFlashNewsLive(row)));
        setError(null);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setError(cause instanceof Error ? cause.message : 'Unknown error');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { items, loading, error };
}

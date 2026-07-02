import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export async function uploadMedia(
  supabase: SupabaseClient<Database>,
  path: string,
  blob: Blob,
  mimeType: string,
) {
  const { error } = await supabase.storage
    .from("media")
    .upload(path, blob, { contentType: mimeType, upsert: false });
  if (error) throw error;
  return path;
}

export async function signedMediaUrl(
  supabase: SupabaseClient<Database>,
  path: string,
  expiresIn = 3600,
) {
  const { data, error } = await supabase.storage.from("media").createSignedUrl(path, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}

export async function signedMediaUrls(
  supabase: SupabaseClient<Database>,
  paths: string[],
  expiresIn = 3600,
) {
  if (paths.length === 0) return new Map<string, string>();
  const { data, error } = await supabase.storage
    .from("media")
    .createSignedUrls(paths, expiresIn);
  if (error) throw error;
  return new Map(data.map((d) => [d.path ?? "", d.signedUrl]));
}

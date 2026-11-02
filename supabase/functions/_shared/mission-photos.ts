import { encodeBase64 } from 'jsr:@std/encoding@1/base64';
import { admin } from './clients.ts';

export type MissionImage = { data: string; mimeType: 'image/jpeg' | 'image/png' | 'image/webp' };

/** 기준 사진의 일부만 비교하지 않도록 하나라도 읽지 못하면 예외를 던진다. 호출자는 기준 사진 없이 판정한다. */
export async function loadMissionPhotos(missionId: string) {
  const signal = AbortSignal.timeout(5_000);
  const { data, error } = await admin
    .from('mission_photos')
    .select('storage_path, hint')
    .eq('mission_id', missionId)
    .order('id')
    .limit(5)
    .abortSignal(signal);
  if (error) throw error;
  if ((data?.length ?? 0) > 4) throw new Error('too_many_reference_photos');
  const photos = await Promise.all(
    (data ?? []).map(async ({ storage_path, hint }) => {
      const { data: file, error } = await admin.storage
        .from('mission-photos')
        .download(storage_path, {}, { signal });
      if (error || !file || file.size > 2 * 1024 * 1024)
        throw new Error('reference_photo_unavailable');
      const bytes = new Uint8Array(await file.arrayBuffer());
      const mimeType =
        bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
          ? 'image/jpeg'
          : [137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => bytes[i] === v)
            ? 'image/png'
            : bytes.length >= 12 &&
                String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
                String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'
              ? 'image/webp'
              : null;
      if (!mimeType) throw new Error('invalid_reference_photo');
      return { image: { data: encodeBase64(bytes), mimeType } as MissionImage, hint };
    }),
  );
  return photos;
}

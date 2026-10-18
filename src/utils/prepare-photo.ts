import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

const MaxSide = 1024;

/** PRD F4: 업로드 전 긴 변 1024px, JPEG 품질 0.8로 변환한다. */
export async function preparePhoto(uri: string, width: number, height: number) {
  const context = ImageManipulator.manipulate(uri);
  if (Math.max(width, height) > MaxSide) {
    context.resize(width >= height ? { width: MaxSide } : { height: MaxSide });
  }
  const image = await context.renderAsync();
  const result = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.8, base64: true });
  if (!result.base64) throw new Error('photo_encode_failed');
  return { uri: result.uri, bytes: base64ToBytes(result.base64) };
}

function base64ToBytes(base64: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

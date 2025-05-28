import { put } from '@vercel/blob';

// export async function uploadToVercelBlob(buffer, filename) {
export async function uploadToVercelBlob(buffer) {
  const uniqueFileName = `recording-${Date.now()}.mp3`;
  const blob = await put(uniqueFileName, buffer, {
    access: 'public',
    contentType: 'audio/mpeg',
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });

  return blob.url; // Public URL
}
// here we are storing the audio file with a fixed name in vercel blob storage. Blob storage is a good option for storing audio files because it is fast and scalable.

import { put } from '@vercel/blob';

// export async function uploadToVercelBlob(buffer, filename) {
export async function uploadToVercelBlob(buffer) {
  const blob = await put('latest-recoding.mp3', buffer, {
    access: 'public',
    contentType: 'audio/mpeg',
    token: process.env.BLOB_READ_WRITE_TOKEN,
    allowOverwrite: true,
  });

  return blob.url; // Public URL
}
// here we are storing the audio file with a fixed name in vercel blob storage. Blob storage is a good option for storing audio files because it is fast and scalable.
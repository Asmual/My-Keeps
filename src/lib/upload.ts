export async function uploadMedia(
  fileOrBase64: string | Blob | File,
  type: 'image' | 'voice' | 'avatar' = 'image'
): Promise<string> {
  try {
    let response: Response;

    if (typeof fileOrBase64 === 'string') {
      response = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file: fileOrBase64, type }),
      });
    } else {
      const formData = new FormData();
      formData.append('file', fileOrBase64);
      formData.append('type', type);
      response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
    }

    const data = await response.json();
    if (data.success && data.url) {
      return data.url;
    }
    throw new Error(data.error || 'Failed to upload media');
  } catch (err) {
    console.error('uploadMedia error:', err);
    // If upload fails and input was a string, return string as fallback
    if (typeof fileOrBase64 === 'string') {
      return fileOrBase64;
    }
    throw err;
  }
}

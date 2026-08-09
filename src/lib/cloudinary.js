export const cloudinaryConfig = {
  cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,

  openWidget: (callback) => {
    if (typeof window === "undefined" || !window.cloudinary) { console.error("Cloudinary not loaded"); return; }
    const widget = window.cloudinary.createUploadWidget(
      { cloudName: cloudinaryConfig.cloudName, uploadPreset: cloudinaryConfig.uploadPreset, sources: ["local", "url"], cropping: true, maxFiles: 1 },
      (error, result) => { if (!error && result.event === "success") callback(result.info.secure_url); }
    );
    widget.open();
  },

  /**
   * Upload a File straight to Cloudinary's unsigned endpoint.
   *
   * The widget is still available, but it depends on an external script being
   * loaded and can't report progress into our own UI. This talks to the REST
   * endpoint directly, so a plain file input or a drag-and-drop works even if
   * the widget script never arrives.
   *
   * @param file       a File from an <input type="file"> or a drop event
   * @param onProgress called with 0..100
   * @returns the secure URL
   */
  uploadFile: (file, onProgress) =>
    new Promise((resolve, reject) => {
      if (!file) return reject(new Error('No file given.'));
      if (!file.type?.startsWith('image/')) return reject(new Error('That file is not an image.'));
      if (file.size > 10 * 1024 * 1024) return reject(new Error('Images must be under 10 MB.'));
      if (!cloudinaryConfig.cloudName || !cloudinaryConfig.uploadPreset) {
        return reject(new Error('Cloudinary is not configured.'));
      }

      const body = new FormData();
      body.append('file', file);
      body.append('upload_preset', cloudinaryConfig.uploadPreset);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
      };

      xhr.onload = () => {
        try {
          const res = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300 && res.secure_url) resolve(res.secure_url);
          else reject(new Error(res?.error?.message || `Upload failed (${xhr.status}).`));
        } catch {
          reject(new Error('Cloudinary returned an unreadable response.'));
        }
      };

      xhr.onerror = () => reject(new Error('Network error during upload.'));
      xhr.send(body);
    }),

  // Optimization helper
  getOptimizedUrl: (url, width = 800) => {
    if (!url || !url.includes('res.cloudinary.com')) return url;
    return url.replace('/upload/', `/upload/w_${width},f_auto,q_auto/`);
  }
};
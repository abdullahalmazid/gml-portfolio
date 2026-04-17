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

  // Optimization helper
  getOptimizedUrl: (url, width = 800) => {
    if (!url || !url.includes('res.cloudinary.com')) return url;
    return url.replace('/upload/', `/upload/w_${width},f_auto,q_auto/`);
  }
};

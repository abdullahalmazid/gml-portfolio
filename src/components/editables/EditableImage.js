'use client';
import { useAdmin } from '@/context/AdminContext';
import { cloudinaryConfig } from '@/lib/cloudinary';
import { updateData } from '@/lib/firestore-helpers';
import { Camera, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

export default function EditableImage({ 
  pageId, 
  fieldPath, 
  src, 
  alt = 'Image', 
  className = '', 
  fill = false, 
  width = 500, 
  height = 500 
}) {
  const { editMode } = useAdmin();
  const [currentSrc, setCurrentSrc] = useState(src);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    setCurrentSrc(src);
  }, [src]);

  const handleUpload = async (url) => {
    setIsUploading(true);
    setCurrentSrc(url); // Optimistic UI update
    
    try {
      // Save to Firestore immediately
      await updateData(`pages/${pageId}`, { [fieldPath]: url });
      toast.success('Image saved!');
    } catch (error) {
      console.error("Save failed", error);
      toast.error('Failed to save image.');
      setCurrentSrc(src); // Revert on error
    } finally {
      setIsUploading(false);
    }
  };

  const openWidget = () => {
    cloudinaryConfig.openWidget(handleUpload);
  };

  // --- VIEW MODE ---
  if (!editMode) {
    if (!currentSrc) return null;
    
    return fill ? (
      // FIX: Added w-full h-full so the div expands to fill the parent container
      <div className="relative w-full h-full">
        <Image 
          src={currentSrc} 
          alt={alt} 
          fill 
          className={`object-cover ${className}`} // User className usually goes on Image for object-fit
          unoptimized 
        />
      </div>
    ) : (
      <Image 
        src={currentSrc} 
        alt={alt} 
        width={width} 
        height={height} 
        className={className} 
        unoptimized 
      />
    );
  }

  // --- EDIT MODE ---
  return (
    // FIX: Ensure root wrapper fills container when fill=true
    <div 
      className={`relative group ${fill ? 'w-full h-full' : ''}`} 
      onClick={openWidget}
    >
      {isUploading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20 cursor-pointer">
          <RefreshCw className="animate-spin text-white" size={24} />
        </div>
      )}
      
      {currentSrc ? (
        fill ? (
          // FIX: Inner wrapper also needs w-full h-full
          <div className="relative w-full h-full">
            <Image 
              src={currentSrc} 
              alt={alt} 
              fill 
              className={`object-cover ${className}`} 
              unoptimized 
            />
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-30 cursor-pointer">
              <div className="bg-white p-2 rounded-full shadow-lg">
                <RefreshCw size={20} />
              </div>
            </div>
          </div>
        ) : (
          <div className="relative">
             <Image 
               src={currentSrc} 
               alt={alt} 
               width={width} 
               height={height} 
               className={className} 
               unoptimized 
             />
             <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-30 cursor-pointer">
                <div className="bg-white p-2 rounded-full shadow-lg">
                  <RefreshCw size={20} />
                </div>
            </div>
          </div>
        )
      ) : (
        // Empty State
        <div className={`flex flex-col items-center justify-center bg-[var(--bg-secondary)] border-2 border-dashed border-[var(--border)] rounded-xl cursor-pointer hover:border-[var(--accent)] transition-colors ${fill ? 'w-full h-full' : className}`}>
          <Camera className="text-[var(--text-muted)] mb-2" size={24} />
          <span className="text-xs text-[var(--text-muted)">Upload Image</span>
        </div>
      )}
    </div>
  );
}
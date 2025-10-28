// components/UserAvatar.tsx
"use client";

import React, { useState } from "react";
import Image from "next/image";

interface UserAvatarProps {
  src?: string;
  alt: string;
  size?: number;
  editable?: boolean;
  onAvatarChange?: (file: File) => void;
  isUploading?: boolean;
}

export default function UserAvatar({
  src,
  alt,
  size = 120,
  editable = false,
  onAvatarChange,
  isUploading = false,
}: UserAvatarProps) {
  const [avatarSrc, setAvatarSrc] = useState(src || "/avatar-placeholder.png");

  // Update avatarSrc when src prop changes
  React.useEffect(() => {
    if (src) {
      setAvatarSrc(src);
    }
  }, [src]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !onAvatarChange) return;

    // Basic validation
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be less than 5MB");
      return;
    }

    // Create preview immediately
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarSrc(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Call parent handler
    onAvatarChange(file);
  };

  return (
    <div className="relative">
      <div className={`relative ${editable ? "cursor-pointer group" : ""}`}>
        <Image
          src={avatarSrc}
          alt={alt}
          width={size}
          height={size}
          className="object-cover rounded-full border-4 border-white shadow-lg"
          onError={() => setAvatarSrc("/avatar-placeholder.png")}
        />
        {editable && (
          <>
            <div className="absolute inset-0 bg-black bg-opacity-40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-sm font-medium">Change</span>
            </div>
            {isUploading && (
              <div className="absolute inset-0 bg-black bg-opacity-60 rounded-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            )}
          </>
        )}
      </div>
      {editable && (
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isUploading}
        />
      )}
    </div>
  );
}
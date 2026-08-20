"use client";

import { CldUploadWidget } from "next-cloudinary";
import { Button } from "@/components/ui/button";
import { ImagePlus, X } from "lucide-react";
import Image from "next/image";

interface ImageUploadProps {
  value: string;
  onChange: (url: string, publicId: string) => void;
}

export function ImageUpload({ value, onChange }: ImageUploadProps) {
  const onUpload = (result: any) => {
    onChange(result.info.secure_url, result.info.public_id);
  };

  return (
    <div className="space-y-4">
      {value ? (
        <div className="relative h-48 w-48 overflow-hidden rounded-md border border-stone-200">
          <Image 
            fill 
            src={value} 
            alt="Upload" 
            className="object-cover"
          />
          <button
            type="button"
            onClick={() => onChange("", "")}
            className="absolute top-2 right-2 rounded-full bg-red-500 p-1 text-white shadow-sm hover:bg-red-600 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <CldUploadWidget 
          uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ovvi_products"}
          onSuccess={onUpload}
        >
          {({ open }) => {
            return (
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => open()}
                className="w-48 h-48 border-dashed flex flex-col gap-2 text-stone-500"
              >
                <ImagePlus className="h-8 w-8" />
                Upload Image
              </Button>
            );
          }}
        </CldUploadWidget>
      )}
    </div>
  );
}

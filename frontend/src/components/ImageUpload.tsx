import React, { useRef, useState } from 'react';

interface ImageUploadProps {
  multiple?: boolean;
  onChange: (files: File[]) => void;
  initialPreviews?: string[]; // existing image URLs
}

const ImageUpload: React.FC<ImageUploadProps> = ({ multiple, onChange, initialPreviews = [] }) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [previews, setPreviews] = useState<string[]>(initialPreviews);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const fileArr = Array.from(files);
    onChange(fileArr);

    // generate previews
    const newPreviews: string[] = [];
    fileArr.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          newPreviews.push(reader.result.toString());
          // push all at end to avoid multiple renders
          if (newPreviews.length === fileArr.length) {
            setPreviews([...previews, ...newPreviews]);
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="">
      <div
        className="flex flex-wrap gap-4 border-2 border-dashed border-accentNeutral rounded-lg p-4 cursor-pointer hover:border-secondary-500"
        onClick={() => fileInputRef.current?.click()}
      >
        {previews.map((src, idx) => (
          <img key={idx} src={src} alt="preview" className="w-24 h-24 object-cover rounded" />
        ))}
        <div className="flex flex-col items-center justify-center text-center text-accentNeutral w-24">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 mb-2 text-secondary-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-xs">{multiple ? 'Upload Images' : 'Upload Image'}</span>
        </div>
      </div>
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        multiple={multiple}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
};

export default ImageUpload;

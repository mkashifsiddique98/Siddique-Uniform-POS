// components/MultiImageDropzone.tsx
import { Dispatch, SetStateAction, useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { X } from "lucide-react"; // Optional: Lucide icons for close button (install via `npm install lucide-react`)

export default function MultiImageDropzone({
  images,
  setImages,
}: {
  images: string[];
  setImages: Dispatch<SetStateAction<string[]>>;
}) {
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const formData = new FormData();
    acceptedFiles.forEach((file) => formData.append("files", file));

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.files) {
        setImages([...images, ...data.files]);
      }
    } catch (err) {
      console.error("Upload failed:", err);
    }
  }, []);

  const handleRemoveImage = async (index: number) => {
    const imageToDelete = images[index];
    const filename = imageToDelete.split("/").pop(); // get only the filename

    if (!filename) return;

    try {
      const res = await fetch("/api/upload/delete-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ filename }),
      });

      const data = await res.json();

      if (res.ok) {
        // Only update state if deletion was successful
        setImages((prev) => prev.filter((_, i) => i !== index));
        console.log("Deleted:", data.message);
      } else {
        console.error("Error deleting image:", data.error);
      }
    } catch (error) {
      console.error("Network error while deleting image:", error);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: true,
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className="border-2 border-dashed border-gray-400 rounded-lg p-6 text-center cursor-pointer"
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the images here...</p>
        ) : (
          <p>Drag & drop multiple images here, or click to select</p>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {images.map((src, index) => (
          <div
            key={index}
            className="relative w-full h-64 overflow-hidden rounded shadow group"
          >
            <img
              src={src}
              alt={`Uploaded ${index}`}
              className="w-full h-64 object-cover "
            />
            <button
              onClick={() => handleRemoveImage(index)}
              className="absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full p-1 hover:bg-opacity-80 transition"
              title="Remove"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

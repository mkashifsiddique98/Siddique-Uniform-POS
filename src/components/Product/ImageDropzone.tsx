import { Dispatch, SetStateAction, useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { X } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
export default function MultiImageDropzone({
  images,
  setImages,
}: {
  images: string[];
  setImages: Dispatch<SetStateAction<string[]>>;
}) {
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);

 const onDrop = useCallback(
  async (acceptedFiles: File[]) => {
    const formData = new FormData();
    acceptedFiles.forEach((file) => formData.append("files", file));

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (data.files) {
        setImages((prev) => {
          const existing = new Set(prev.map((url) => url.split("/").pop()));
          const newFiles: string[] = [];

          data.files.forEach((url: string) => {
            const filename = url.split("/").pop();
            if (!filename) return;

            if (existing.has(filename)) {
              // Show toast for duplicate
              toast({
                title: "Duplicate Image",
                description: `Image "${filename}" is already added.`,
                variant: "destructive",
              });
            } else {
              newFiles.push(url);
            }
          });

          return [...prev, ...newFiles];
        });
      }
    } catch (err) {
      console.error("Upload failed:", err);
      toast({
        title: "Upload failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  },
  [setImages]
);


  const handleRemoveImage = async (index: number) => {
  const imageToDelete = images[index];
  const filename = imageToDelete.split("/").pop();
  if (!filename) return;

  setDeletingIndex(index); // mark as deleting

  try {
    const res = await fetch("/api/upload/delete-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename }),
    });

    if (res.ok) {
      console.log("Deleted from server");
    } else {
      console.warn(
        "Image not found on server, removing from UI anyway",
        filename
      );
    }
  } catch (error) {
    console.error("Network error, removing from UI anyway", error);
  } finally {
    // Always remove from state, even if server deletion failed
    setImages((prev) => prev.filter((_, i) => i !== index));
    setDeletingIndex(null); // reset deleting state
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
              className="w-full h-64 object-cover"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                handleRemoveImage(index);
              }}
              disabled={deletingIndex === index} // ✅ disable while deleting
              className={`absolute top-1 right-1 rounded-full p-1 transition ${
                deletingIndex === index
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-black bg-opacity-50 text-white hover:bg-opacity-80"
              }`}
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

"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { AlertTriangle, Camera, RotateCcw, X } from "lucide-react";
import { useCameraCapture } from "@/lib/media/useCameraCapture";

export function CameraCapture({
  photos,
  onChange,
  max = 3,
  label,
}: {
  photos: File[];
  onChange: (photos: File[]) => void;
  max?: number;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const camera = useCameraCapture();

  const previewUrls = useMemo(() => photos.map((p) => URL.createObjectURL(p)), [photos]);
  useEffect(() => {
    return () => previewUrls.forEach((u) => URL.revokeObjectURL(u));
  }, [previewUrls]);

  function openCamera() {
    setOpen(true);
    camera.start();
  }

  function closeCamera() {
    camera.close();
    setOpen(false);
  }

  function confirmPhoto() {
    if (!camera.capturedBlob) return;
    const file = new File([camera.capturedBlob], `photo-${Date.now()}.jpg`, { type: "image/jpeg" });
    onChange([...photos, file]);
    closeCamera();
  }

  function removePhoto(index: number) {
    onChange(photos.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-2">
      {label && <span className="text-sm font-medium text-neutral-600">{label}</span>}
      <div className="flex gap-3">
        {photos.map((_, i) => (
          <div key={i} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-neutral-100">
            <Image src={previewUrls[i]} alt={`Photo ${i + 1}`} fill unoptimized className="object-cover" />
            <button
              type="button"
              onClick={() => removePhoto(i)}
              aria-label="Remove photo"
              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        {photos.length < max && (
          <button
            type="button"
            onClick={openCamera}
            className="flex h-20 w-20 shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-neutral-300 text-neutral-500 active:scale-95"
          >
            <Camera className="h-5 w-5" />
            <span className="text-[11px] font-medium">Add photo</span>
          </button>
        )}
      </div>
      {photos.length > 0 && (
        <span className="text-xs text-neutral-400">
          {photos.length} of {max} photos
        </span>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black">
          <button
            type="button"
            onClick={closeCamera}
            aria-label="Close camera"
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white active:scale-95"
          >
            <X className="h-5 w-5" />
          </button>

          {camera.status === "captured" && camera.capturedUrl ? (
            <>
              <div className="relative flex-1">
                <Image src={camera.capturedUrl} alt="Captured photo" fill unoptimized className="object-contain" />
              </div>
              <div className="flex items-center justify-center gap-4 bg-black p-6 pb-10">
                <button
                  type="button"
                  onClick={camera.retake}
                  className="flex items-center gap-2 rounded-full bg-white/10 px-5 py-3 text-base font-medium text-white active:scale-95"
                >
                  <RotateCcw className="h-5 w-5" /> Retake
                </button>
                <button
                  type="button"
                  onClick={confirmPhoto}
                  className="rounded-full bg-blue-600 px-6 py-3 text-base font-medium text-white active:scale-95"
                >
                  Use photo
                </button>
              </div>
            </>
          ) : camera.status === "denied" ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center text-white">
              <AlertTriangle className="h-8 w-8 text-amber-400" />
              <p className="text-base">Camera access is blocked. Allow it in your browser settings and try again.</p>
              <button
                type="button"
                onClick={camera.start}
                className="rounded-full bg-white/10 px-5 py-3 text-sm font-medium active:scale-95"
              >
                Try again
              </button>
            </div>
          ) : camera.status === "unsupported" ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center text-white">
              <AlertTriangle className="h-8 w-8 text-amber-400" />
              <p className="text-base">Camera isn&apos;t supported on this browser.</p>
            </div>
          ) : (
            <>
              <video ref={camera.videoRef} playsInline muted className="flex-1 bg-black object-cover" />
              <div className="flex items-center justify-center bg-black p-8">
                <button
                  type="button"
                  onClick={camera.capture}
                  disabled={camera.status !== "streaming"}
                  aria-label="Take photo"
                  className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-white/20 disabled:opacity-40"
                >
                  <span className="h-12 w-12 rounded-full bg-white" />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

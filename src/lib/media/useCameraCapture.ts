"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type CameraStatus =
  | "idle"
  | "requesting-permission"
  | "streaming"
  | "captured"
  | "denied"
  | "unsupported";

export function useCameraCapture() {
  const [status, setStatus] = useState<CameraStatus>("idle");
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const start = useCallback(async () => {
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setStatus("unsupported");
      return;
    }
    setStatus("requesting-permission");
    setCapturedBlob(null);
    setCapturedUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStatus("streaming");
    } catch {
      setStatus("denied");
    }
  }, []);

  const capture = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        setCapturedBlob(blob);
        setCapturedUrl(URL.createObjectURL(blob));
        setStatus("captured");
        stopStream();
      },
      "image/jpeg",
      0.9,
    );
  }, [stopStream]);

  const retake = useCallback(() => {
    start();
  }, [start]);

  const close = useCallback(() => {
    stopStream();
    setCapturedUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setCapturedBlob(null);
    setStatus("idle");
  }, [stopStream]);

  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  return {
    status,
    videoRef,
    capturedUrl,
    capturedBlob,
    start,
    capture,
    retake,
    close,
  };
}

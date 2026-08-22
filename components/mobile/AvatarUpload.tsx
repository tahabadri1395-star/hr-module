"use client";

import { useState, useRef } from "react";
import { bg, accentGradient, neuRaised } from "@/lib/mobile-theme";

export default function MobileAvatarUpload({ name, initialUrl }: { name: string; initialUrl: string | null }) {
  const [url, setUrl] = useState(initialUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/profile/picture", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed.");
      setUrl(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white overflow-hidden relative"
        style={{ background: accentGradient, boxShadow: neuRaised }}
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={name} className="w-full h-full object-cover" />
        ) : (
          name.charAt(0)
        )}
      </button>
      <div
        className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
        style={{ backgroundColor: bg, boxShadow: neuRaised }}
      >
        <svg width="12" height="12" fill="none" viewBox="0 0 24 24">
          <path d="M15 8h.01M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFile} className="hidden" />
      {uploading && <p className="absolute top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-medium" style={{ color: "#4F46E5" }}>Uploading…</p>}
      {error && <p className="absolute top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-medium" style={{ color: "#DC2626" }}>{error}</p>}
    </div>
  );
}

"use client";

import { useState, useRef } from "react";

export default function AvatarUpload({ name, initialUrl }: { name: string; initialUrl: string | null }) {
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
    <div className="relative inline-block mx-auto mb-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="w-16 h-16 rounded-full bg-white/15 flex items-center justify-center text-2xl font-bold text-white overflow-hidden relative group"
        style={{ boxShadow: "0 0 0 4px rgba(255,255,255,0.12)" }}
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={name} className="w-full h-full object-cover" />
        ) : (
          name.charAt(0)
        )}
        <span
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
        >
          {uploading ? (
            <span className="text-[10px] font-medium text-white">Uploading…</span>
          ) : (
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
              <path d="M15 8h.01M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </span>
      </button>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFile} className="hidden" />
      {error && <p className="absolute top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] font-medium" style={{ color: "#FCA5A5" }}>{error}</p>}
    </div>
  );
}

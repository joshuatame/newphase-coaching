"use client";

import { useRef, useState } from "react";
import { adminGetMediaUploadUrl } from "@/lib/api/newphase";
import { AdminButton } from "@/components/admin/ui";

interface ImageUploadFieldProps {
  label: string;
  value?: string;
  onChange: (url: string) => void;
}

/**
 * Pick a local image → signed upload → public URL into the form field.
 */
export function ImageUploadField({
  label,
  value,
  onChange,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const upload = async (file: File) => {
    setBusy(true);
    setError("");
    try {
      const signed = await adminGetMediaUploadUrl({
        fileName: file.name,
        contentType: file.type || "image/jpeg",
        fileSizeBytes: file.size,
      });
      if (!signed?.uploadUrl || !signed.fileUrl) {
        throw new Error("Could not get upload URL");
      }
      const put = await fetch(signed.uploadUrl, {
        method: signed.method || "PUT",
        headers: { "Content-Type": file.type || "image/jpeg" },
        body: file,
      });
      if (!put.ok) {
        throw new Error(`Upload failed (${put.status})`);
      }
      onChange(signed.fileUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs uppercase tracking-[0.16em] text-steel">
          {label}
        </span>
        <AdminButton
          type="button"
          variant="ghost"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? "Uploading…" : "Upload"}
        </AdminButton>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void upload(file);
        }}
      />
      {value ? (
        <div className="overflow-hidden rounded-xl border border-[color:var(--edge)] bg-graphite">
          <img src={value} alt="" className="h-36 w-full object-cover" />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex h-36 w-full items-center justify-center rounded-xl border border-dashed border-[color:var(--edge-strong)] bg-graphite/40 text-sm text-steel hover:text-off-white"
        >
          Choose photo
        </button>
      )}
      {error && <p className="text-xs text-red-300">{error}</p>}
    </div>
  );
}

export default ImageUploadField;

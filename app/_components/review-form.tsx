"use client";

import { useState, type ReactNode, type FormEvent } from "react";
import { useFormStatus } from "react-dom";

function SaveButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return <button className="portal-button portal-button-primary" disabled={pending} type="submit">{pending ? "Menyimpan..." : label}</button>;
}

export function ReviewForm({ action, children, className = "portal-form", saveLabel = "Simpan" }: { action?: (form: FormData) => void | Promise<void>; children: ReactNode; className?: string; saveLabel?: string }) {
  const [review, setReview] = useState<[string, string][] | null>(null);
  function reviewSubmission(event: FormEvent<HTMLFormElement>) {
    if (review) return;
    event.preventDefault();
    const form = event.currentTarget;
    const entries = [...new FormData(form).entries()].filter(([key]) => !key.startsWith("$ACTION") && !["recordId", "visitId", "feedbackId"].includes(key));
    setReview(entries.map(([key, value]) => [key, key.toLowerCase().includes("password") ? "••••••••" : value instanceof File ? value.name || "Tidak ada berkas" : value]));
  }
  return <form action={action} className={className} onSubmit={reviewSubmission}>
    <div hidden={!!review} className="portal-form-fields">{children}</div>
    {review ? <div className="portal-state-card portal-review-card" aria-live="polite">
      <h2>Periksa Kembali</h2>
      <dl className="portal-record">{review.map(([key, value], index) => <div key={`${key}-${index}`}><dt>{key}</dt><dd>{value || "-"}</dd></div>)}</dl>
      <button className="portal-button portal-button-secondary" type="button" onClick={() => setReview(null)}>Ubah Isian</button>
      <SaveButton label={saveLabel} />
    </div> : null}
  </form>;
}

"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  AdminButton,
  DataTable,
  Field,
  Modal,
  Select,
  TextArea,
  TextInput,
  Toggle,
  type Column,
} from "@/components/admin/ui";
import {
  adminGetTestimonials,
  adminCreateTestimonial,
  adminUpdateTestimonial,
  adminDeleteTestimonial,
} from "@/lib/api/newphase";
import type { Testimonial } from "@/types/newphase";

const EMPTY: Partial<Testimonial> = {
  name: "",
  role: "",
  result: "",
  quote: "",
  rating: 5,
  featured: false,
};

export default function AdminTestimonialsPage() {
  const [rows, setRows] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Testimonial> | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      setRows(await adminGetTestimonials());
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const set = (patch: Partial<Testimonial>) =>
    setEditing((e) => ({ ...(e || {}), ...patch }));

  const save = async () => {
    if (!editing?.name || !editing?.quote) {
      setError("Name and quote are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (editing.id) await adminUpdateTestimonial(editing.id, editing);
      else await adminCreateTestimonial(editing);
      setModalOpen(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (t: Testimonial) => {
    if (!confirm(`Delete testimonial from "${t.name}"?`)) return;
    await adminDeleteTestimonial(t.id).catch(() => {});
    await load();
  };

  const columns: Column<Testimonial>[] = [
    { key: "name", header: "Name" },
    { key: "result", header: "Result", render: (r) => r.result || r.role || "—" },
    {
      key: "quote",
      header: "Quote",
      render: (r) => (
        <span className="line-clamp-1 max-w-xs text-steel">{r.quote}</span>
      ),
    },
    { key: "rating", header: "Rating", render: (r) => `${r.rating ?? 5}★` },
  ];

  return (
    <AdminShell title="Testimonials">
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-steel">Manage client testimonials.</p>
        <AdminButton
          onClick={() => {
            setEditing({ ...EMPTY });
            setError("");
            setModalOpen(true);
          }}
        >
          + New Testimonial
        </AdminButton>
      </div>

      {loading ? (
        <div className="h-64 animate-pulse rounded-2xl surface" />
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          empty="No testimonials yet."
          actions={(row) => (
            <>
              <AdminButton
                variant="ghost"
                onClick={() => {
                  setEditing({ ...row });
                  setError("");
                  setModalOpen(true);
                }}
              >
                Edit
              </AdminButton>
              <AdminButton variant="danger" onClick={() => remove(row)}>
                Delete
              </AdminButton>
            </>
          )}
        />
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing?.id ? "Edit Testimonial" : "New Testimonial"}
        footer={
          <>
            <AdminButton variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </AdminButton>
            <AdminButton onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </AdminButton>
          </>
        }
      >
        {editing && (
          <div className="space-y-4">
            {error && (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {error}
              </p>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name">
                <TextInput
                  value={editing.name || ""}
                  onChange={(e) => set({ name: e.target.value })}
                />
              </Field>
              <Field label="Result / role">
                <TextInput
                  value={editing.result || ""}
                  onChange={(e) => set({ result: e.target.value })}
                  placeholder="e.g. Lost 8kg"
                />
              </Field>
            </div>
            <Field label="Quote">
              <TextArea
                rows={4}
                value={editing.quote || ""}
                onChange={(e) => set({ quote: e.target.value })}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Rating">
                <Select
                  value={String(editing.rating ?? 5)}
                  onChange={(e) => set({ rating: Number(e.target.value) })}
                >
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {n} stars
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Image URL">
                <TextInput
                  value={editing.imageUrl || ""}
                  onChange={(e) => set({ imageUrl: e.target.value })}
                />
              </Field>
            </div>
            <Toggle
              checked={Boolean(editing.featured)}
              onChange={(v) => set({ featured: v })}
              label="Feature on homepage"
            />
          </div>
        )}
      </Modal>
    </AdminShell>
  );
}

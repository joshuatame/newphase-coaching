"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  AdminButton,
  DataTable,
  Field,
  Modal,
  TextArea,
  TextInput,
  type Column,
} from "@/components/admin/ui";
import {
  adminGetFaqs,
  adminCreateFaq,
  adminUpdateFaq,
  adminDeleteFaq,
  adminGetSections,
  adminUpdateSection,
} from "@/lib/api/newphase";
import type { Faq, Section } from "@/types/newphase";

export default function AdminContentPage() {
  const [tab, setTab] = useState<"faqs" | "sections">("faqs");

  return (
    <AdminShell title="Content">
      <div className="mb-6 flex gap-2">
        {(["faqs", "sections"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-2 text-sm capitalize transition-colors ${
              tab === t
                ? "bg-accent text-obsidian"
                : "border border-[color:var(--edge-strong)] text-soft-silver hover:text-off-white"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "faqs" ? <FaqManager /> : <SectionManager />}
    </AdminShell>
  );
}

/* ------------------------------ FAQ manager ------------------------------ */
function FaqManager() {
  const [rows, setRows] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Faq> | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      setRows(await adminGetFaqs());
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const set = (patch: Partial<Faq>) =>
    setEditing((e) => ({ ...(e || {}), ...patch }));

  const save = async () => {
    if (!editing?.question || !editing?.answer) {
      setError("Question and answer are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (editing.id) await adminUpdateFaq(editing.id, editing);
      else await adminCreateFaq(editing);
      setModalOpen(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (f: Faq) => {
    if (!confirm("Delete this FAQ?")) return;
    await adminDeleteFaq(f.id).catch(() => {});
    await load();
  };

  const columns: Column<Faq>[] = [
    { key: "question", header: "Question" },
    { key: "order", header: "Order", render: (r) => r.order ?? 0 },
  ];

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-steel">Manage FAQ entries.</p>
        <AdminButton
          onClick={() => {
            setEditing({ question: "", answer: "", order: rows.length + 1 });
            setError("");
            setModalOpen(true);
          }}
        >
          + New FAQ
        </AdminButton>
      </div>

      {loading ? (
        <div className="h-64 animate-pulse rounded-2xl surface" />
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          empty="No FAQs yet."
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
        title={editing?.id ? "Edit FAQ" : "New FAQ"}
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
            <Field label="Question">
              <TextInput
                value={editing.question || ""}
                onChange={(e) => set({ question: e.target.value })}
              />
            </Field>
            <Field label="Answer">
              <TextArea
                rows={5}
                value={editing.answer || ""}
                onChange={(e) => set({ answer: e.target.value })}
              />
            </Field>
            <Field label="Order">
              <TextInput
                type="number"
                value={String(editing.order ?? 0)}
                onChange={(e) => set({ order: Number(e.target.value) })}
              />
            </Field>
          </div>
        )}
      </Modal>
    </>
  );
}

/* ---------------------------- Section manager ---------------------------- */
function SectionManager() {
  const [rows, setRows] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Section | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      setRows(await adminGetSections());
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    setError("");
    try {
      await adminUpdateSection(editing.id, editing);
      setModalOpen(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<Section>[] = [
    { key: "key", header: "Key" },
    { key: "title", header: "Title", render: (r) => r.title || "—" },
  ];

  return (
    <>
      <p className="mb-6 text-sm text-steel">
        Edit editable content sections. Sections are defined by the backend.
      </p>
      {loading ? (
        <div className="h-64 animate-pulse rounded-2xl surface" />
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          empty="No editable sections are configured yet."
          actions={(row) => (
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
          )}
        />
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Edit: ${editing?.key || ""}`}
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
            <Field label="Eyebrow">
              <TextInput
                value={editing.eyebrow || ""}
                onChange={(e) =>
                  setEditing({ ...editing, eyebrow: e.target.value })
                }
              />
            </Field>
            <Field label="Title">
              <TextInput
                value={editing.title || ""}
                onChange={(e) =>
                  setEditing({ ...editing, title: e.target.value })
                }
              />
            </Field>
            <Field label="Subtitle">
              <TextInput
                value={editing.subtitle || ""}
                onChange={(e) =>
                  setEditing({ ...editing, subtitle: e.target.value })
                }
              />
            </Field>
            <Field label="Body">
              <TextArea
                rows={5}
                value={editing.body || ""}
                onChange={(e) =>
                  setEditing({ ...editing, body: e.target.value })
                }
              />
            </Field>
          </div>
        )}
      </Modal>
    </>
  );
}

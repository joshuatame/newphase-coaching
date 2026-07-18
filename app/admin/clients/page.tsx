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
  adminGetClients,
  adminCreateClient,
  adminUpdateClient,
  adminDeleteClient,
} from "@/lib/api/newphase";
import { CLIENT_CATEGORIES } from "@/lib/fallbacks";
import type { Client } from "@/types/newphase";

const EMPTY: Partial<Client> = {
  name: "",
  category: "Fat Loss",
  result: "",
  summary: "",
  story: "",
  beforeImageUrl: "",
  afterImageUrl: "",
  featured: false,
};

export default function AdminClientsPage() {
  const [rows, setRows] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Client> | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      setRows(await adminGetClients());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load clients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setEditing({ ...EMPTY });
    setError("");
    setModalOpen(true);
  };
  const openEdit = (c: Client) => {
    setEditing({ ...c });
    setError("");
    setModalOpen(true);
  };

  const save = async () => {
    if (!editing?.name) {
      setError("Name is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (editing.id) {
        await adminUpdateClient(editing.id, editing);
      } else {
        await adminCreateClient(editing);
      }
      setModalOpen(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (c: Client) => {
    if (!confirm(`Delete client "${c.name}"?`)) return;
    await adminDeleteClient(c.id).catch(() => {});
    await load();
  };

  const set = (patch: Partial<Client>) =>
    setEditing((e) => ({ ...(e || {}), ...patch }));

  const columns: Column<Client>[] = [
    { key: "name", header: "Name" },
    { key: "category", header: "Category", render: (r) => r.category || "—" },
    { key: "result", header: "Result", render: (r) => r.result || "—" },
    {
      key: "featured",
      header: "Featured",
      render: (r) => (r.featured ? "Yes" : "No"),
    },
  ];

  return (
    <AdminShell title="Clients">
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-steel">
          Manage client transformations and stories.
        </p>
        <AdminButton onClick={openNew}>+ New Client</AdminButton>
      </div>

      {error && !modalOpen && (
        <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      {loading ? (
        <div className="h-64 animate-pulse rounded-2xl surface" />
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          empty="No clients yet. Add your first transformation."
          actions={(row) => (
            <>
              <AdminButton variant="ghost" onClick={() => openEdit(row)}>
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
        title={editing?.id ? "Edit Client" : "New Client"}
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
              <Field label="Category">
                <Select
                  value={editing.category || ""}
                  onChange={(e) => set({ category: e.target.value })}
                >
                  {CLIENT_CATEGORIES.filter((c) => c !== "All").map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label="Result headline">
              <TextInput
                value={editing.result || ""}
                onChange={(e) => set({ result: e.target.value })}
                placeholder="e.g. -12kg in 16 weeks"
              />
            </Field>
            <Field label="Summary">
              <TextInput
                value={editing.summary || ""}
                onChange={(e) => set({ summary: e.target.value })}
              />
            </Field>
            <Field label="Full story">
              <TextArea
                rows={4}
                value={editing.story || ""}
                onChange={(e) => set({ story: e.target.value })}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Before image URL">
                <TextInput
                  value={editing.beforeImageUrl || ""}
                  onChange={(e) => set({ beforeImageUrl: e.target.value })}
                />
              </Field>
              <Field label="After image URL">
                <TextInput
                  value={editing.afterImageUrl || ""}
                  onChange={(e) => set({ afterImageUrl: e.target.value })}
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

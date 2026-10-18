"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  AdminButton,
  DataTable,
  Field,
  Modal,
  Select,
  TextInput,
  type Column,
} from "@/components/admin/ui";
import {
  adminCreateStaff,
  adminGetStaff,
  adminRemoveStaff,
  adminUpdateStaff,
} from "@/lib/api/newphase";
import { ApiError } from "@/lib/api/client";
import type { StaffInput, StaffRole, StaffUser } from "@/types/newphase";

type Editing = StaffInput & { id?: string };

const ROLE_LABEL: Record<StaffRole, string> = {
  ADMIN: "Admin — full access, can manage users",
  EDITOR: "Editor — manage site content only",
};

function errorMessage(e: unknown, fallback: string) {
  if (e instanceof ApiError && e.status === 403) {
    return "Only admins can manage users.";
  }
  return e instanceof Error ? e.message : fallback;
}

function formatDate(value?: string | null) {
  if (!value) return "Never";
  return new Date(value).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AdminUsersPage() {
  const [rows, setRows] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setLoadError("");
    try {
      setRows(await adminGetStaff());
    } catch (e) {
      setLoadError(errorMessage(e, "Could not load users."));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const set = (patch: Partial<Editing>) =>
    setEditing((e) => ({ ...(e || {}), ...patch }));

  const openNew = () => {
    setEditing({ email: "", displayName: "", role: "ADMIN", password: "" });
    setError("");
    setModalOpen(true);
  };

  const openEdit = (row: StaffUser) => {
    setEditing({
      id: row.id,
      email: row.email,
      displayName: row.displayName || "",
      role: row.role,
      password: "",
    });
    setError("");
    setModalOpen(true);
  };

  const save = async () => {
    if (!editing) return;
    const isNew = !editing.id;
    if (isNew && !editing.email?.trim()) {
      setError("Email is required.");
      return;
    }
    if ((isNew || editing.password) && (editing.password || "").length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (isNew) {
        await adminCreateStaff({
          email: editing.email?.trim(),
          displayName: editing.displayName?.trim() || undefined,
          role: editing.role,
          password: editing.password,
        });
      } else {
        await adminUpdateStaff(editing.id!, {
          displayName: editing.displayName?.trim() ?? "",
          role: editing.role,
          ...(editing.password ? { password: editing.password } : {}),
        });
      }
      setModalOpen(false);
      await load();
    } catch (e) {
      setError(errorMessage(e, "Save failed"));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row: StaffUser) => {
    if (!confirm(`Remove admin access for ${row.email}?`)) return;
    try {
      await adminRemoveStaff(row.id);
      await load();
    } catch (e) {
      alert(errorMessage(e, "Could not remove user."));
    }
  };

  const columns: Column<StaffUser>[] = [
    {
      key: "displayName",
      header: "Name",
      render: (r) => r.displayName || "—",
    },
    { key: "email", header: "Email" },
    {
      key: "role",
      header: "Access",
      render: (r) => (r.role === "ADMIN" ? "Admin" : "Editor"),
    },
    {
      key: "lastLoginAt",
      header: "Last login",
      render: (r) => formatDate(r.lastLoginAt),
    },
  ];

  return (
    <AdminShell title="Users">
      <div className="mb-6 flex items-center justify-between gap-4">
        <p className="text-sm text-steel">
          People who can log in and manage this site. Each person gets their own
          email and password.
        </p>
        <AdminButton onClick={openNew}>+ Add User</AdminButton>
      </div>

      {loading ? (
        <div className="h-64 animate-pulse rounded-2xl surface" />
      ) : loadError ? (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {loadError}
        </p>
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          empty="No users yet."
          actions={(row) => (
            <>
              <AdminButton variant="ghost" onClick={() => openEdit(row)}>
                Edit
              </AdminButton>
              <AdminButton variant="danger" onClick={() => remove(row)}>
                Remove
              </AdminButton>
            </>
          )}
        />
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing?.id ? "Edit User" : "Add User"}
        footer={
          <>
            <AdminButton variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </AdminButton>
            <AdminButton onClick={save} disabled={saving}>
              {saving ? "Saving…" : editing?.id ? "Save" : "Add User"}
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
                  value={editing.displayName || ""}
                  onChange={(e) => set({ displayName: e.target.value })}
                  placeholder="e.g. Coach Siegwalt"
                />
              </Field>
              <Field label="Email">
                <TextInput
                  type="email"
                  value={editing.email || ""}
                  onChange={(e) => set({ email: e.target.value })}
                  disabled={Boolean(editing.id)}
                  autoComplete="off"
                />
              </Field>
            </div>
            <Field label="Access">
              <Select
                value={editing.role || "ADMIN"}
                onChange={(e) => set({ role: e.target.value as StaffRole })}
              >
                {(Object.keys(ROLE_LABEL) as StaffRole[]).map((role) => (
                  <option key={role} value={role}>
                    {ROLE_LABEL[role]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field
              label={editing.id ? "New password (leave blank to keep)" : "Password"}
            >
              <TextInput
                type="password"
                value={editing.password || ""}
                onChange={(e) => set({ password: e.target.value })}
                placeholder="At least 8 characters"
                autoComplete="new-password"
              />
            </Field>
            <p className="text-xs text-steel">
              Share the password with them directly. They log in at the same
              admin page with their own email.
            </p>
          </div>
        )}
      </Modal>
    </AdminShell>
  );
}

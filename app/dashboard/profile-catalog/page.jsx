"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { hasAnyRole } from "@/lib/roleUtils";

const FIELD_TYPES = [
  "text",
  "textarea",
  "number",
  "date",
  "select",
  "checkbox",
  "phone",
  "url",
  "email",
  "file",
];

const INPUT_CLASS =
  "rounded-lg border border-slate-300 bg-white px-3 py-2 font-body text-slate-900 placeholder:text-slate-500 focus:border-[#f97316] focus:outline-none focus:ring-2 focus:ring-orange-100";

function emptyField() {
  return {
    key: "",
    label: "",
    description: "",
    fieldType: "text",
    isRequired: false,
    optionsRaw: "",
  };
}

export default function ProfileCatalogPage() {
  const { data: session, status } = useSession();
  const [items, setItems] = useState([]);
  const [newField, setNewField] = useState(emptyField());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const hasAccess = hasAnyRole(session?.user?.role, ["DATA", "DEVELOPER"]);

  useEffect(() => {
    if (status === "authenticated" && hasAccess) {
      void loadCatalog();
    }
  }, [status, hasAccess]);

  async function loadCatalog() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/profile/catalog");
      if (!response.ok) {
        throw new Error("Failed to load profile fields");
      }

      const payload = await response.json();
      setItems(Array.isArray(payload.items) ? payload.items : []);
    } catch (loadError) {
      setError(loadError.message || "Failed to load profile fields");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const options = newField.optionsRaw
        ? newField.optionsRaw
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        : null;

      const response = await fetch("/api/profile/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: newField.key.trim(),
          label: newField.label.trim(),
          description: newField.description.trim(),
          fieldType: newField.fieldType,
          isRequired: newField.isRequired,
          options,
          isActive: true,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "Failed to create field");
      }

      setNewField(emptyField());
      await loadCatalog();
    } catch (createError) {
      setError(createError.message || "Failed to create field");
    } finally {
      setSaving(false);
    }
  }

  async function updateField(id, updates) {
    setError("");
    try {
      const response = await fetch("/api/profile/catalog", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "Failed to update field");
      }

      const updated = await response.json();
      setItems((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch (updateError) {
      setError(updateError.message || "Failed to update field");
    }
  }

  if (status === "loading") {
    return <div className="font-body text-slate-600">Loading...</div>;
  }

  if (!hasAccess) {
    return (
      <div className="font-body text-red-600">
        Akses ditolak. Halaman ini hanya untuk DATA/DEVELOPER.
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-900">
      <section className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm">
        <div className="h-1.5 bg-[#f97316]" />
        <div className="p-6">
        <h1 className="font-heading font-bold text-2xl text-slate-900">
          Master Profile Field Catalog
        </h1>
        <p className="font-body text-sm text-slate-600 mt-1">
          Atur field biodata kru yang dipakai untuk auto-request di form internal.
        </p>
        </div>
      </section>

      <section className="bg-white border border-slate-300 rounded-2xl p-6 shadow-sm">
        <h2 className="font-heading font-semibold text-lg">Tambah Field Baru</h2>
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
          <input
            type="text"
            value={newField.key}
            onChange={(event) =>
              setNewField((prev) => ({ ...prev, key: event.target.value }))
            }
            placeholder="key (example: fullName)"
            className={INPUT_CLASS}
            required
          />
          <input
            type="text"
            value={newField.label}
            onChange={(event) =>
              setNewField((prev) => ({ ...prev, label: event.target.value }))
            }
            placeholder="Label"
            className={INPUT_CLASS}
            required
          />
          <select
            value={newField.fieldType}
            onChange={(event) =>
              setNewField((prev) => ({ ...prev, fieldType: event.target.value }))
            }
            className={INPUT_CLASS}
          >
            {FIELD_TYPES.map((fieldType) => (
              <option key={fieldType} value={fieldType}>
                {fieldType}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={newField.description}
            onChange={(event) =>
              setNewField((prev) => ({ ...prev, description: event.target.value }))
            }
            placeholder="Description"
            className={`md:col-span-2 ${INPUT_CLASS}`}
          />
          <input
            type="text"
            value={newField.optionsRaw}
            onChange={(event) =>
              setNewField((prev) => ({ ...prev, optionsRaw: event.target.value }))
            }
            placeholder="Options comma separated (for select/checkbox)"
            className={INPUT_CLASS}
          />

          <label className="inline-flex items-center gap-2 text-sm font-body text-slate-700">
            <input
              type="checkbox"
              checked={newField.isRequired}
              onChange={(event) =>
                setNewField((prev) => ({ ...prev, isRequired: event.target.checked }))
              }
            />
            Wajib diisi
          </label>

          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-slate-900 text-white font-body font-semibold disabled:opacity-60"
          >
            {saving ? "Menyimpan..." : "Tambah Field"}
          </button>
        </form>
        {error ? <p className="text-sm text-red-600 font-body mt-3">{error}</p> : null}
      </section>

      <section className="bg-white border border-slate-300 rounded-2xl shadow-sm overflow-x-auto">
        {loading ? (
          <div className="p-6 font-body text-slate-600">Loading fields...</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-body font-semibold text-slate-700">Key</th>
                <th className="text-left px-4 py-3 font-body font-semibold text-slate-700">Label</th>
                <th className="text-left px-4 py-3 font-body font-semibold text-slate-700">Type</th>
                <th className="text-left px-4 py-3 font-body font-semibold text-slate-700">Required</th>
                <th className="text-left px-4 py-3 font-body font-semibold text-slate-700">Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 font-mono text-xs text-slate-700">{item.key}</td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={item.label || ""}
                      onChange={(event) => {
                        const value = event.target.value;
                        setItems((prev) =>
                          prev.map((row) =>
                            row.id === item.id ? { ...row, label: value } : row,
                          ),
                        );
                      }}
                      onBlur={(event) => updateField(item.id, { label: event.target.value })}
                      className="w-full rounded border border-slate-300 bg-white px-2 py-1 font-body text-slate-900 placeholder:text-slate-500 focus:border-[#f97316] focus:outline-none"
                    />
                  </td>
                  <td className="px-4 py-3 font-body text-slate-700">{item.fieldType}</td>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={Boolean(item.isRequired)}
                      onChange={(event) => {
                        const checked = event.target.checked;
                        setItems((prev) =>
                          prev.map((row) =>
                            row.id === item.id ? { ...row, isRequired: checked } : row,
                          ),
                        );
                        void updateField(item.id, { isRequired: checked });
                      }}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={Boolean(item.isActive)}
                      onChange={(event) => {
                        const checked = event.target.checked;
                        setItems((prev) =>
                          prev.map((row) =>
                            row.id === item.id ? { ...row, isActive: checked } : row,
                          ),
                        );
                        void updateField(item.id, { isActive: checked });
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

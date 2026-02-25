"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";

function buildInitialBiodata(profile) {
  if (!profile?.biodata || typeof profile.biodata !== "object" || Array.isArray(profile.biodata)) {
    return {};
  }
  return profile.biodata;
}

function renderValue(value) {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

export default function ProfileSetupPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [fields, setFields] = useState([]);
  const [biodata, setBiodata] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (status !== "authenticated") return;
    void loadProfile();
  }, [status]);

  const missingRequired = useMemo(() => {
    return fields
      .filter((field) => field.isRequired)
      .filter((field) => {
        const value = biodata[field.key];
        if (value === null || value === undefined) return true;
        if (typeof value === "string") return value.trim().length === 0;
        if (Array.isArray(value)) return value.length === 0;
        return false;
      })
      .map((field) => field.key);
  }, [fields, biodata]);

  async function loadProfile() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/profile/me");
      if (!response.ok) {
        throw new Error("Failed to load profile");
      }

      const payload = await response.json();
      const fieldItems = Array.isArray(payload.fields) ? payload.fields : [];
      setFields(fieldItems);
      setBiodata(buildInitialBiodata(payload.profile));
    } catch (loadError) {
      setError(loadError.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }

  async function uploadFile(fieldKey, file) {
    const response = await fetch("/api/profile/upload-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
        fieldKey,
      }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || "Failed to prepare upload");
    }

    const { uploadUrl, key } = await response.json();

    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type,
      },
    });

    if (!uploadResponse.ok) {
      throw new Error("Failed to upload file");
    }

    return key;
  }

  async function handleSave(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/profile/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          biodata,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (payload?.missingFields) {
          throw new Error(
            `Field wajib belum lengkap: ${payload.missingFields.join(", ")}`,
          );
        }
        throw new Error(payload?.error || "Failed to save profile");
      }

      setSuccess("Data profil tersimpan.");
      if (missingRequired.length === 0) {
        setTimeout(() => {
          router.push("/dashboard/forms");
        }, 600);
      }
    } catch (saveError) {
      setError(saveError.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  if (status === "loading" || loading) {
    return (
      <main className="min-h-screen bg-[#f5f5f5] py-10 px-4">
        <div className="max-w-3xl mx-auto bg-white border border-gray-200 rounded-xl p-6 font-body text-gray-500">
          Loading profile...
        </div>
      </main>
    );
  }

  if (status !== "authenticated") {
    return (
      <main className="min-h-screen bg-[#f5f5f5] py-10 px-4">
        <div className="max-w-3xl mx-auto bg-white border border-gray-200 rounded-xl p-6 space-y-3">
          <h1 className="font-heading text-2xl font-bold text-gray-900">Login Required</h1>
          <p className="font-body text-gray-600">
            Anda harus login untuk melengkapi pendataan kru.
          </p>
          <button
            onClick={() => signIn("google", { callbackUrl: "/profile/setup" })}
            className="px-4 py-2 rounded-lg bg-gray-900 text-white font-body"
          >
            Login dengan Google
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f5f5] py-10 px-4">
      <div className="max-w-3xl mx-auto space-y-4">
        <section className="bg-white border border-gray-200 rounded-xl p-6">
          <h1 className="font-heading text-3xl font-bold text-gray-900">
            Pendataan Kru (Master Profile)
          </h1>
          <p className="font-body text-gray-600 mt-2">
            Isi data ini sekali untuk mengurangi pertanyaan berulang saat mengisi form internal.
          </p>
          <p className="font-body text-sm text-gray-500 mt-2">
            Login sebagai: <span className="font-semibold">{session.user.email}</span>
          </p>
        </section>

        <form onSubmit={handleSave} className="space-y-4">
          {fields.map((field) => {
            const value = biodata[field.key];

            if (field.fieldType === "textarea") {
              return (
                <section key={field.id} className="bg-white border border-gray-200 rounded-xl p-5">
                  <label className="block font-body text-sm text-gray-700">
                    <span className="font-semibold text-gray-900">{field.label}</span>
                    {field.isRequired ? <span className="text-red-500"> *</span> : null}
                    <textarea
                      className="mt-2 w-full min-h-24 px-3 py-2 rounded-lg border border-gray-300"
                      value={renderValue(value)}
                      onChange={(event) =>
                        setBiodata((prev) => ({
                          ...prev,
                          [field.key]: event.target.value,
                        }))
                      }
                    />
                  </label>
                </section>
              );
            }

            if (field.fieldType === "select") {
              const options = Array.isArray(field.options) ? field.options : [];
              return (
                <section key={field.id} className="bg-white border border-gray-200 rounded-xl p-5">
                  <label className="block font-body text-sm text-gray-700">
                    <span className="font-semibold text-gray-900">{field.label}</span>
                    {field.isRequired ? <span className="text-red-500"> *</span> : null}
                    <select
                      className="mt-2 w-full px-3 py-2 rounded-lg border border-gray-300"
                      value={renderValue(value)}
                      onChange={(event) =>
                        setBiodata((prev) => ({
                          ...prev,
                          [field.key]: event.target.value,
                        }))
                      }
                    >
                      <option value="">Pilih opsi</option>
                      {options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                </section>
              );
            }

            if (field.fieldType === "file") {
              return (
                <section key={field.id} className="bg-white border border-gray-200 rounded-xl p-5 space-y-2">
                  <label className="block font-body text-sm text-gray-700">
                    <span className="font-semibold text-gray-900">{field.label}</span>
                    {field.isRequired ? <span className="text-red-500"> *</span> : null}
                  </label>
                  <input
                    type="file"
                    onChange={async (event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      setError("");
                      try {
                        const key = await uploadFile(field.key, file);
                        setBiodata((prev) => ({ ...prev, [field.key]: key }));
                      } catch (uploadError) {
                        setError(uploadError.message || "Failed to upload file");
                      }
                    }}
                  />
                  {value ? (
                    <p className="text-xs font-mono text-gray-500 break-all">{String(value)}</p>
                  ) : null}
                </section>
              );
            }

            const typeByField = {
              number: "number",
              date: "date",
              email: "email",
              phone: "tel",
              url: "url",
            };

            return (
              <section key={field.id} className="bg-white border border-gray-200 rounded-xl p-5">
                <label className="block font-body text-sm text-gray-700">
                  <span className="font-semibold text-gray-900">{field.label}</span>
                  {field.isRequired ? <span className="text-red-500"> *</span> : null}
                  <input
                    type={typeByField[field.fieldType] || "text"}
                    value={renderValue(value)}
                    onChange={(event) =>
                      setBiodata((prev) => ({
                        ...prev,
                        [field.key]: event.target.value,
                      }))
                    }
                    className="mt-2 w-full px-3 py-2 rounded-lg border border-gray-300"
                  />
                </label>
              </section>
            );
          })}

          {missingRequired.length > 0 ? (
            <p className="font-body text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              Field wajib belum lengkap: {missingRequired.join(", ")}
            </p>
          ) : null}

          {error ? (
            <p className="font-body text-sm text-red-600">{error}</p>
          ) : null}
          {success ? (
            <p className="font-body text-sm text-green-600">{success}</p>
          ) : null}

          <button
            type="submit"
            disabled={saving}
            className="w-full md:w-auto px-5 py-2 rounded-lg bg-gray-900 text-white font-body font-semibold disabled:opacity-60"
          >
            {saving ? "Menyimpan..." : "Simpan Pendataan"}
          </button>
        </form>
      </div>
    </main>
  );
}

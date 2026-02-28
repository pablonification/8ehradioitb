"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import Image from "next/image";
import { extractFileKeysFromValue } from "@/lib/profile/database";

function buildInitialBiodata(profile) {
  if (
    !profile?.biodata ||
    typeof profile.biodata !== "object" ||
    Array.isArray(profile.biodata)
  ) {
    return {};
  }
  return profile.biodata;
}

function renderValue(value) {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

function Shell({ children }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#fbf7ed_0%,#f3efe5_55%,#eee8dc_100%)] flex flex-col font-body">
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 px-6 py-3">
        <div className="mx-auto max-w-3xl">
          <Image
            src="/8eh-real-long.png"
            alt="8EH Radio ITB"
            width={140}
            height={36}
            className="h-8 w-auto object-contain"
            priority
          />
        </div>
      </header>
      <main className="flex-1 px-4 pt-10 pb-16 sm:px-6">
        <div className="mx-auto max-w-3xl w-full">{children}</div>
      </main>
      <footer className="text-xs text-slate-500 font-body text-center py-4">
        © {new Date().getFullYear()} Technic 8EH Radio ITB. All rights reserved.
      </footer>
    </div>
  );
}

function ProfileSetupSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="h-1.5 bg-[#f97316]" />
        <div className="space-y-3 px-8 py-6">
          <div className="h-8 w-80 rounded bg-slate-200" />
          <div className="h-4 w-2/3 rounded bg-slate-100" />
          <div className="h-4 w-1/2 rounded bg-slate-100" />
        </div>
      </div>

      {[1, 2, 3, 4].map((item) => (
        <div
          key={item}
          className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden"
        >
          <div className="space-y-3 px-6 py-5">
            <div className="h-4 w-52 rounded bg-slate-200" />
            <div className="h-11 w-full rounded-lg bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
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
  const [downloadingKey, setDownloadingKey] = useState("");

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

  async function handleDownloadFile(fileKey) {
    if (!fileKey) return;
    setDownloadingKey(fileKey);
    setError("");

    try {
      const response = await fetch("/api/files/download-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ key: fileKey }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || "Gagal membuat download link");
      }

      const payload = await response.json();
      if (!payload.downloadUrl) {
        throw new Error("Download URL tidak tersedia");
      }

      window.open(payload.downloadUrl, "_blank", "noopener,noreferrer");
    } catch (downloadError) {
      setError(downloadError.message || "Gagal mengunduh file");
    } finally {
      setDownloadingKey("");
    }
  }

  if (status === "loading" || loading) {
    return (
      <Shell>
        <ProfileSetupSkeleton />
      </Shell>
    );
  }

  if (status !== "authenticated") {
    return (
      <Shell>
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="h-1.5 bg-[#f97316]" />
          <div className="p-8 space-y-4">
            <h1 className="font-heading text-2xl font-bold text-slate-900">
              Login Diperlukan
            </h1>
            <p className="font-body text-slate-600">
              Anda harus login untuk melengkapi pendataan kru.
            </p>
            <button
              onClick={() =>
                signIn("google", { callbackUrl: "/profile/setup" })
              }
              className="px-5 py-2 rounded-lg bg-[#f97316] hover:bg-[#ea6c0a] text-white font-body font-semibold transition-colors"
            >
              Login dengan Google
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="h-1.5 bg-[#f97316]" />
          <div className="px-8 py-6">
            <h1 className="font-heading text-2xl font-bold text-slate-900">
              Pendataan Kru (Master Profile)
            </h1>
            <p className="font-body text-slate-600 mt-2">
              Isi data ini sekali untuk mengurangi pertanyaan berulang saat
              mengisi form internal.
            </p>
            <p className="font-body text-sm text-slate-500 mt-1">
              Login sebagai:{" "}
              <span className="font-semibold">{session.user.email}</span>
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-3">
          {fields.map((field) => {
            const value = biodata[field.key];
            const fileKeys =
              field.fieldType === "file"
                ? Array.from(new Set(extractFileKeysFromValue(value)))
                : [];

            if (field.fieldType === "textarea") {
              return (
                <div
                  key={field.id}
                  className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden"
                >
                  <div className="px-6 py-5">
                    <label className="block font-body text-sm text-slate-700">
                      <span className="font-semibold text-slate-900">
                        {field.label}
                      </span>
                      {field.isRequired ? (
                        <span className="text-red-500"> *</span>
                      ) : null}
                      <textarea
                        className="mt-2 w-full min-h-24 px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#f97316]/40 focus:border-[#f97316] transition"
                        value={renderValue(value)}
                        onChange={(event) =>
                          setBiodata((prev) => ({
                            ...prev,
                            [field.key]: event.target.value,
                          }))
                        }
                      />
                    </label>
                  </div>
                </div>
              );
            }

            if (field.fieldType === "select") {
              const options = Array.isArray(field.options) ? field.options : [];
              return (
                <div
                  key={field.id}
                  className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden"
                >
                  <div className="px-6 py-5">
                    <label className="block font-body text-sm text-slate-700">
                      <span className="font-semibold text-slate-900">
                        {field.label}
                      </span>
                      {field.isRequired ? (
                        <span className="text-red-500"> *</span>
                      ) : null}
                      <select
                        className="mt-2 w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#f97316]/40 focus:border-[#f97316] transition"
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
                  </div>
                </div>
              );
            }

            if (field.fieldType === "file") {
              return (
                <div
                  key={field.id}
                  className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden"
                >
                  <div className="px-6 py-5 space-y-2">
                    <label className="block font-body text-sm text-slate-700">
                      <span className="font-semibold text-slate-900">
                        {field.label}
                      </span>
                      {field.isRequired ? (
                        <span className="text-red-500"> *</span>
                      ) : null}
                    </label>
                    <input
                      type="file"
                      className="font-body text-sm text-slate-600"
                      onChange={async (event) => {
                        const file = event.target.files?.[0];
                        if (!file) return;
                        setError("");
                        try {
                          const key = await uploadFile(field.key, file);
                          setBiodata((prev) => ({ ...prev, [field.key]: key }));
                        } catch (uploadError) {
                          setError(
                            uploadError.message || "Failed to upload file",
                          );
                        }
                      }}
                    />
                    {fileKeys.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {fileKeys.map((fileKey, index) => (
                          <button
                            key={`${fileKey}-${index}`}
                            type="button"
                            onClick={() => void handleDownloadFile(fileKey)}
                            disabled={downloadingKey === fileKey}
                            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                          >
                            {downloadingKey === fileKey
                              ? "Mempersiapkan..."
                              : `Download file ${index + 1}`}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
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
              <div
                key={field.id}
                className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden"
              >
                <div className="px-6 py-5">
                  <label className="block font-body text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">
                      {field.label}
                    </span>
                    {field.isRequired ? (
                      <span className="text-red-500"> *</span>
                    ) : null}
                    <input
                      type={typeByField[field.fieldType] || "text"}
                      value={renderValue(value)}
                      onChange={(event) =>
                        setBiodata((prev) => ({
                          ...prev,
                          [field.key]: event.target.value,
                        }))
                      }
                      className="mt-2 w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#f97316]/40 focus:border-[#f97316] transition"
                    />
                  </label>
                </div>
              </div>
            );
          })}

          {missingRequired.length > 0 ? (
            <p className="font-body text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              Field wajib belum lengkap: {missingRequired.join(", ")}
            </p>
          ) : null}

          {error ? (
            <p className="font-body text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          ) : null}
          {success ? (
            <p className="font-body text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              {success}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-[#f97316] hover:bg-[#ea6c0a] text-white font-body font-semibold transition-colors disabled:opacity-60"
          >
            {saving ? "Menyimpan..." : "Simpan Pendataan"}
          </button>
        </form>
      </div>
    </Shell>
  );
}

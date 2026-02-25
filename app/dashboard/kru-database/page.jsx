"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { hasAnyRole } from "@/lib/roleUtils";

export default function KruDatabasePage() {
  const { data: session, status } = useSession();
  const hasAccess = hasAnyRole(session?.user?.role, ["DATA", "DEVELOPER"]);

  const [query, setQuery] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "authenticated" && hasAccess) {
      void loadProfiles();
    }
  }, [status, hasAccess]);

  async function loadProfiles(search = "") {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/profile/database?q=${encodeURIComponent(search)}`);
      if (!response.ok) {
        throw new Error("Failed to fetch kru database");
      }
      const payload = await response.json();
      setItems(Array.isArray(payload.items) ? payload.items : []);
    } catch (loadError) {
      setError(loadError.message || "Failed to fetch kru database");
    } finally {
      setLoading(false);
    }
  }

  const rows = useMemo(() => items.slice(0, 200), [items]);

  if (status === "loading") {
    return <div className="font-body text-gray-500">Loading...</div>;
  }

  if (!hasAccess) {
    return (
      <div className="font-body text-red-600">
        Akses ditolak. Halaman ini hanya untuk DATA/DEVELOPER.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h1 className="font-heading font-bold text-2xl text-gray-900">Kru Database</h1>
        <p className="font-body text-sm text-gray-500 mt-1">
          Akses penuh data master kru. Gunakan pencarian untuk filter cepat.
        </p>

        <form
          className="mt-4 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void loadProfiles(query);
          }}
        >
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari nama / email / NIM"
            className="flex-1 px-3 py-2 rounded-lg border border-gray-300 font-body"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-gray-900 text-white font-body"
          >
            Cari
          </button>
        </form>

        {error ? <p className="text-sm text-red-600 font-body mt-3">{error}</p> : null}
      </section>

      <section className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-x-auto">
        {loading ? (
          <div className="p-6 font-body text-gray-500">Loading profiles...</div>
        ) : rows.length === 0 ? (
          <div className="p-6 font-body text-gray-500">Tidak ada data.</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-body font-semibold text-gray-700">Nama</th>
                <th className="text-left px-4 py-3 font-body font-semibold text-gray-700">Email</th>
                <th className="text-left px-4 py-3 font-body font-semibold text-gray-700">NIM</th>
                <th className="text-left px-4 py-3 font-body font-semibold text-gray-700">Role</th>
                <th className="text-left px-4 py-3 font-body font-semibold text-gray-700">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((item) => {
                const biodata =
                  item.biodata && typeof item.biodata === "object" && !Array.isArray(item.biodata)
                    ? item.biodata
                    : {};

                return (
                  <tr key={item.id}>
                    <td className="px-4 py-3 font-body text-gray-700">
                      {biodata.fullName || item.displayName || item.user?.name || "-"}
                    </td>
                    <td className="px-4 py-3 font-body text-gray-700">{item.user?.email || "-"}</td>
                    <td className="px-4 py-3 font-body text-gray-700">{biodata.nim || "-"}</td>
                    <td className="px-4 py-3 font-body text-gray-700">{item.user?.role || "-"}</td>
                    <td className="px-4 py-3 font-body text-gray-700 whitespace-nowrap">
                      {new Date(item.updatedAt).toLocaleString("id-ID")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

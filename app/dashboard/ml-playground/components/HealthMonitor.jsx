"use client";

import { useEffect, useState } from "react";
import { FiRefreshCw, FiCheck, FiX } from "react-icons/fi";

export default function HealthMonitor() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ml/health");
      if (!res.ok) {
        throw new Error("API offline");
      }
      const data = await res.json();
      setHealth(data);
      setLastChecked(new Date());
    } catch (err) {
      setHealth({ status: "offline" });
      setError(err.message || "Failed to connect");
      setLastChecked(new Date());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return undefined;
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const formatDate = (date) => {
    if (!date) return "-";
    const d = new Date(date);
    return d.toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const isOnline = health?.status === "ok";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-heading font-semibold text-gray-800">
            API Health Monitor
          </h3>
          <p className="text-sm text-gray-600 font-body">
            Cek status layanan ML dan pantau otomatis setiap 30 detik.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm font-body text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto-refresh 30s
          </label>
          <button
            onClick={fetchHealth}
            disabled={loading}
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-body font-semibold transition-colors cursor-pointer"
          >
            <FiRefreshCw className={loading ? "animate-spin" : ""} size={16} />
            {loading ? "Checking..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
        {loading && !health ? (
          <div className="text-center py-8 text-gray-500 font-body">Loading...</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3 font-body">
            <div className="flex items-center gap-3">
              <div
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-semibold border ${
                  isOnline
                    ? "bg-green-50 text-green-700 border-green-200"
                    : "bg-red-50 text-red-700 border-red-200"
                }`}
              >
                {isOnline ? <FiCheck size={16} /> : <FiX size={16} />}
                {isOnline ? "Online" : "Offline"}
              </div>
              <span className="text-gray-500">Status</span>
            </div>

            <div>
              <div className="text-sm text-gray-500">Version</div>
              <div className="text-gray-900 font-semibold">{health?.version || "-"}</div>
            </div>

            <div>
              <div className="text-sm text-gray-500">Checked</div>
              <div className="text-gray-900 font-semibold">{formatDate(lastChecked)}</div>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg font-body">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

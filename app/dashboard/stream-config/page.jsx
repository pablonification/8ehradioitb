"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export default function StreamConfigPage() {
  const { data: session } = useSession();
  const [config, setConfig] = useState({
    baseUrls: [],
    defaultUrl: "",
    fallbackUrl: "",
    onAir: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [newUrl, setNewUrl] = useState("");

  const isAdmin =
    session && ["DEVELOPER", "TECHNIC"].includes(session.user.role);

  useEffect(() => {
    fetch("/api/stream-config")
      .then((res) => res.json())
      .then((data) => {
        setConfig({
          baseUrls: data?.baseUrls || [],
          defaultUrl: data?.defaultUrl || "",
          fallbackUrl: data?.fallbackUrl || "",
          onAir: typeof data?.onAir === "boolean" ? data.onAir : true,
        });
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load config");
        setLoading(false);
      });
  }, []);

  const handleAddUrl = () => {
    if (newUrl && !config.baseUrls.includes(newUrl)) {
      setConfig((prev) => ({ ...prev, baseUrls: [...prev.baseUrls, newUrl] }));
      setNewUrl("");
    }
  };

  const handleRemoveUrl = (url) => {
    setConfig((prev) => ({
      ...prev,
      baseUrls: prev.baseUrls.filter((u) => u !== url),
      defaultUrl: prev.defaultUrl === url ? "" : prev.defaultUrl,
      fallbackUrl: prev.fallbackUrl === url ? "" : prev.fallbackUrl,
    }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setConfig((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/stream-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error("Failed to save config");
      setSaving(false);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  if (!isAdmin) return <div className="p-8 text-center font-body">Access denied.</div>;
  if (loading) return <div className="p-8 text-center font-body">Loading...</div>;

  return (
    <div className="p-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-heading font-bold mb-4 text-gray-900">Stream Config</h1>
      <form
        onSubmit={handleSubmit}
        className="space-y-4 bg-gray-50 p-6 rounded-lg shadow-md border border-gray-200"
      >
        <div>
          <label className="block font-semibold font-body text-gray-800 mb-2">Base URLs</label>
          <div className="flex gap-2 mb-2">
            <input
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              className="border border-gray-300 p-3 rounded-md flex-1 font-body text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="https://s3.free-shoutcast.com/stream/18032"
            />
            <button
              type="button"
              onClick={handleAddUrl}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-md font-body font-semibold transition-colors duration-200 shadow-sm"
            >
              Add
            </button>
          </div>
          <ul className="space-y-2 font-body">
            {config.baseUrls.map((url) => (
              <li key={url} className="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-md shadow-sm">
                <span className="flex-1 text-gray-900 text-sm">{url}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveUrl(url)}
                  className="text-red-600 hover:text-red-700 font-semibold text-sm transition-colors"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <label className="block font-semibold font-body text-gray-800 mb-2">Default URL</label>
          <select
            name="defaultUrl"
            value={config.defaultUrl}
            onChange={handleChange}
            className="w-full border border-gray-300 p-3 rounded-md font-body text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            <option value="">Select default</option>
            {config.baseUrls.map((url) => (
              <option key={url} value={url}>
                {url}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-semibold font-body text-gray-800 mb-2">Fallback URL</label>
          <select
            name="fallbackUrl"
            value={config.fallbackUrl}
            onChange={handleChange}
            className="w-full border border-gray-300 p-3 rounded-md font-body text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            <option value="">Select fallback</option>
            {config.baseUrls.map((url) => (
              <option key={url} value={url}>
                {url}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="onAirToggle" className="block font-semibold font-body text-gray-800 mb-2">
            Status Siaran
          </label>
          <div className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-md">
            <span className="font-body text-gray-700">Radio sedang:</span>
            <button
              id="onAirToggle"
              type="button"
              role="switch"
              aria-checked={!!config.onAir}
              onClick={() =>
                handleChange({
                  target: {
                    name: "onAir",
                    type: "checkbox",
                    checked: !config.onAir,
                  },
                })
              }
              className={`relative inline-flex h-7 w-14 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                config.onAir
                  ? "bg-green-500 focus:ring-green-500"
                  : "bg-gray-300 focus:ring-gray-300"
              }`}
            >
              <span
                aria-hidden="true"
                className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out ${
                  config.onAir ? "translate-x-7" : ""
                }`}
              />
              <span className="sr-only">Toggle status siaran radio</span>
            </button>
            <span
              className={`ml-2 font-body text-sm font-semibold ${
                config.onAir ? "text-green-600" : "text-gray-500"
              }`}
            >
              {config.onAir ? "On Air" : "Off Air"}
            </span>
          </div>
        </div>
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-body font-semibold transition-colors duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Configuration"}
        </button>
        {error && <div className="text-red-700 mt-2 font-body bg-red-50 border border-red-200 rounded-md p-3">{error}</div>}
      </form>
    </div>
  );
}

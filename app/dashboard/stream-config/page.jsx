'use client';
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export default function StreamConfigPage() {
  const { data: session } = useSession();
  const [config, setConfig] = useState({ baseUrls: [], defaultUrl: "", fallbackUrl: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [newUrl, setNewUrl] = useState("");

  const isAdmin = session && ["DEVELOPER", "TECHNIC"].includes(session.user.role);

  useEffect(() => {
    fetch("/api/stream-config")
      .then((res) => res.json())
      .then((data) => {
        setConfig({
          baseUrls: data?.baseUrls || [],
          defaultUrl: data?.defaultUrl || "",
          fallbackUrl: data?.fallbackUrl || "",
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
    const { name, value } = e.target;
    setConfig((prev) => ({ ...prev, [name]: value }));
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

  if (!isAdmin) return <div className="p-8 text-center">Access denied.</div>;
  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="p-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Stream Config</h1>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 rounded shadow">
        <div>
          <label className="block font-semibold">Base URLs</label>
          <div className="flex gap-2 mb-2">
            <input
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              className="border p-2 rounded flex-1"
              placeholder="https://s3.free-shoutcast.com/stream/18032"
            />
            <button type="button" onClick={handleAddUrl} className="bg-green-600 text-white px-3 py-1 rounded">Add</button>
          </div>
          <ul className="space-y-1">
            {config.baseUrls.map((url) => (
              <li key={url} className="flex items-center gap-2">
                <span className="flex-1">{url}</span>
                <button type="button" onClick={() => handleRemoveUrl(url)} className="text-red-600">Remove</button>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <label className="block font-semibold">Default URL</label>
          <select name="defaultUrl" value={config.defaultUrl} onChange={handleChange} className="w-full border p-2 rounded">
            <option value="">Select default</option>
            {config.baseUrls.map((url) => (
              <option key={url} value={url}>{url}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-semibold">Fallback URL</label>
          <select name="fallbackUrl" value={config.fallbackUrl} onChange={handleChange} className="w-full border p-2 rounded">
            <option value="">Select fallback</option>
            {config.baseUrls.map((url) => (
              <option key={url} value={url}>{url}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded" disabled={saving}>{saving ? "Saving..." : "Save"}</button>
        {error && <div className="text-red-600 mt-2">{error}</div>}
      </form>
    </div>
  );
} 
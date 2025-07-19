'use client';

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import clsx from "clsx";

export default function PlayerConfigPage() {
  const { data: session } = useSession();
  const [config, setConfig] = useState({ title: "", coverImage: "" });
  const [coverImages, setCoverImages] = useState([]); // all covers
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  const isAdmin = session && ["DEVELOPER", "TECHNIC"].includes(session.user.role);

  useEffect(() => {
    fetch("/api/player-config")
      .then((res) => res.json())
      .then((data) => {
        setConfig({
          title: data?.title || "",
          coverImage: data?.coverImage || "/8eh.png",
        });
        // Always include default as first option
        let covers = data?.coverImages || [];
        if (!covers.includes("/8eh.png")) covers = ["/8eh.png", ...covers];
        else covers = ["/8eh.png", ...covers.filter((c) => c !== "/8eh.png")];
        setCoverImages(covers);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load config");
        setLoading(false);
      });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setConfig((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setError("");
    setSuccess("");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/player-config/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to upload image");
      const data = await res.json();
      // Add to gallery and select as active
      if (!coverImages.includes(data.url)) {
        setCoverImages((prev) => [...prev, data.url]);
      }
      setConfig((prev) => ({ ...prev, coverImage: data.url }));
      // Persist to backend
      await fetch("/api/player-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addCoverImage: data.url, title: config.title, coverImage: data.url }),
      });
      setSuccess("Image uploaded!");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSelectCover = (url) => {
    setConfig((prev) => ({ ...prev, coverImage: url }));
    setSuccess("");
  };

  const handleDeleteCover = async (url) => {
    if (url === "/8eh.png") return;
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/player-config", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) throw new Error("Failed to delete image");
      setCoverImages((prev) => prev.filter((img) => img !== url));
      // If active cover deleted, fallback to default
      setConfig((prev) => ({ ...prev, coverImage: prev.coverImage === url ? "/8eh.png" : prev.coverImage }));
      setSuccess("Image deleted.");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/player-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error("Failed to save config");
      setSaving(false);
      setSuccess("Config saved!");
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  if (!isAdmin) return <div className="p-8 text-center font-body text-gray-700">Access denied.</div>;
  if (loading) return <div className="p-8 text-center font-body text-gray-700">Loading...</div>;

  return (
    <div className="p-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-heading font-bold mb-4 text-gray-900">Player Config</h1>
      <form onSubmit={handleSubmit} className="space-y-4 bg-gray-50 p-6 rounded-lg shadow-md border border-gray-200">
        <div>
          <label className="block font-semibold font-body text-gray-800 mb-2">Title</label>
          <input
            name="title"
            value={config.title}
            onChange={handleChange}
            className="w-full border border-gray-300 p-3 rounded-md font-body text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            required
          />
        </div>
        <div>
          <label className="block font-semibold font-body text-gray-800 mb-2">Cover Images</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full border border-gray-300 p-3 rounded-md mb-2 font-body text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
          <div className="flex flex-wrap gap-4 mt-2">
            {coverImages.map((url) => (
              <div
                key={url}
                className={clsx(
                  "relative group border-2 rounded-lg p-1 bg-white shadow-sm hover:shadow-md transition-all",
                  config.coverImage === url ? "border-blue-600 ring-2 ring-blue-200" : "border-gray-300 hover:border-gray-400"
                )}
                style={{ width: 80, height: 80 }}
              >
                <img
                  src={url}
                  alt="cover"
                  className="object-cover w-full h-full rounded cursor-pointer"
                  onClick={() => handleSelectCover(url)}
                />
                {url !== "/8eh.png" && (
                  <button
                    type="button"
                    onClick={() => handleDeleteCover(url)}
                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-md"
                  >
                    ×
                  </button>
                )}
                {config.coverImage === url && (
                  <span className="absolute bottom-1 left-1 bg-blue-600 text-white text-xs px-2 py-1 rounded-md font-body font-semibold shadow-sm">
                    Active
                  </span>
                )}
              </div>
            ))}
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
        {success && <div className="text-green-700 mt-2 font-body bg-green-50 border border-green-200 rounded-md p-3">{success}</div>}
      </form>
    </div>
  );
} 
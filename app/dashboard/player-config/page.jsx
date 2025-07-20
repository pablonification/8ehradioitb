'use client';

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import clsx from "clsx";
import { FiUpload, FiSave, FiTrash2 } from "react-icons/fi";

export default function PlayerConfigPage() {
  const { data: session } = useSession();
  const [config, setConfig] = useState({ title: "", coverImage: "" });
  const [coverImages, setCoverImages] = useState([]);
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
      if (!coverImages.includes(data.url)) {
        setCoverImages((prev) => [...prev, data.url]);
      }
      setConfig((prev) => ({ ...prev, coverImage: data.url }));
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
    if (url === "/8eh.png" || !window.confirm("Are you sure you want to delete this image?")) return;
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
      setSuccess("Config saved successfully!");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) return <div className="p-8 text-center font-body text-red-500">Access Denied.</div>;
  if (loading) return <div className="p-8 text-center font-body">Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-heading font-bold mb-6 text-gray-800">Player Configuration</h1>
      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-lg shadow-md">
        <div>
          <label htmlFor="title" className="block font-semibold font-body text-gray-700 mb-2">Title</label>
          <input
            id="title"
            name="title"
            value={config.title}
            onChange={handleChange}
            className="w-full border border-gray-300 p-3 rounded-md font-body text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="e.g., Now Playing: Hits of the Week"
            required
          />
        </div>
        <div>
          <label className="block font-semibold font-body text-gray-700 mb-2">Cover Images</label>
          <label htmlFor="cover-upload" className="flex items-center justify-center gap-2 w-full border-2 border-dashed border-gray-300 p-4 rounded-md mb-4 cursor-pointer hover:bg-gray-50 hover:border-blue-500 transition-colors">
             <FiUpload className="text-gray-500"/>
             <span className="text-gray-600 font-body">Upload New Image</span>
             <input id="cover-upload" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          </label>
          
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
            {coverImages.map((url) => (
              <div
                key={url}
                className={clsx(
                  "relative group aspect-square rounded-lg p-1 bg-white shadow-sm hover:shadow-md transition-all cursor-pointer",
                  config.coverImage === url ? "border-2 border-blue-600 ring-2 ring-blue-200" : "border border-gray-300 hover:border-gray-400"
                )}
                onClick={() => handleSelectCover(url)}
              >
                <img src={url} alt="cover" className="object-cover w-full h-full rounded" />
                {url !== "/8eh.png" && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleDeleteCover(url); }}
                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <FiTrash2 size={12}/>
                  </button>
                )}
                 {config.coverImage === url && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-md">
                      <span className="text-white text-xs font-bold">Active</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {error && <div className="text-red-600 mt-2 font-body bg-red-50 p-3 rounded-md">{error}</div>}
        {success && <div className="text-green-600 mt-2 font-body bg-green-50 p-3 rounded-md">{success}</div>}
        
        <div className="pt-4">
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-body font-semibold transition-colors duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            disabled={saving}
          >
            <FiSave/>
            {saving ? "Saving..." : "Save Configuration"}
          </button>
        </div>
      </form>
    </div>
  );
}
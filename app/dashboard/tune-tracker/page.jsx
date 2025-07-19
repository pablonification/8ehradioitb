"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState, useRef } from "react";

const MAX_ENTRIES = 10;

// =============================================================
//  1. KOMPONEN ANAK: Mengelola satu baris formulir secara mandiri
// =============================================================
function TuneEntryForm({ initialEntry, onSaveSuccess }) {
  const [entry, setEntry] = useState(initialEntry);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileInputRef = useRef(null);
  const audioInputRef = useRef(null);

  const handleChange = (field, value) => {
    setEntry((prev) => ({ ...prev, [field]: value }));
    setSuccess("");
    setError("");
  };

  // Remove file logic remains for delete
  const handleRemoveFile = async (field) => {
    setError("");
    setSuccess("");
    if (!entry.id) {
      handleChange(field, "");
      return;
    }
    try {
      const res = await fetch("/api/tune-tracker", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: entry.id, field }),
      });
      if (!res.ok) throw new Error("Failed to remove file.");
      handleChange(field, "");
      setSuccess("File removed.");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    let coverUrl = entry.coverImage;
    let audioUrl = entry.audioUrl;
    // Upload cover if new file selected
    const coverFile = fileInputRef.current?.files?.[0];
    if (coverFile) {
      const formData = new FormData();
      formData.append("file", coverFile);
      formData.append("type", "cover");
      try {
        const res = await fetch("/api/tune-tracker/upload", { method: "POST", body: formData });
        if (!res.ok) throw new Error("Upload cover failed.");
        const data = await res.json();
        coverUrl = data.url;
        if (fileInputRef.current) fileInputRef.current.value = "";
      } catch (err) {
        setError(err.message);
        setSaving(false);
        return;
      }
    }
    // Upload audio if new file selected
    const audioFile = audioInputRef.current?.files?.[0];
    if (audioFile) {
      const formData = new FormData();
      formData.append("file", audioFile);
      formData.append("type", "audio");
      try {
        const res = await fetch("/api/tune-tracker/upload", { method: "POST", body: formData });
        if (!res.ok) throw new Error("Upload audio failed.");
        const data = await res.json();
        audioUrl = data.url;
        if (audioInputRef.current) audioInputRef.current.value = "";
      } catch (err) {
        setError(err.message);
        setSaving(false);
        return;
      }
    }
    try {
      const res = await fetch("/api/tune-tracker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...entry, coverImage: coverUrl, audioUrl }),
      });
      if (!res.ok) throw new Error("Failed to save entry.");
      setSuccess("Entry saved successfully!");
      if (onSaveSuccess) onSaveSuccess();
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 flex flex-col md:flex-row gap-4 items-start">
      <div className="w-8 text-2xl font-mono text-gray-500 pt-2 font-bold">{String(entry.order).padStart(2, "0")}</div>
      <div className="flex-1">
        {/* Pesan status khusus untuk baris ini */}
        {error && <div className="text-red-700 mb-2 text-sm font-body bg-red-50 border border-red-200 rounded-md p-2">{error}</div>}
        {success && <div className="text-green-700 mb-2 text-sm font-body bg-green-50 border border-green-200 rounded-md p-2">{success}</div>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-800 font-body mb-2">Song Title</label>
            <input 
              className="w-full border border-gray-300 p-3 rounded-md mt-1 font-body text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
              value={entry.title} 
              onChange={(e) => handleChange("title", e.target.value)} 
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-800 font-body mb-2">Artist</label>
            <input 
              className="w-full border border-gray-300 p-3 rounded-md mt-1 font-body text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
              value={entry.artist} 
              onChange={(e) => handleChange("artist", e.target.value)} 
              required 
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-800 font-body mb-2">Cover Image</label>
            <div className="flex items-center gap-2 mt-1">
              <input 
                type="file" 
                accept="image/*" 
                ref={fileInputRef} 
                className="text-sm file:mr-2 file:py-2 file:px-3 file:rounded-md file:border-0 file:bg-gray-100 hover:file:bg-gray-200 font-body border border-gray-300 p-2 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
              />
              {entry.coverImage && (
                <>
                  <img src={entry.coverImage} alt="cover" className="w-12 h-12 object-cover rounded-md border border-gray-200 shadow-sm" />
                  <button 
                    type="button" 
                    className="text-red-600 hover:text-red-700 font-bold text-lg transition-colors" 
                    onClick={() => handleRemoveFile("coverImage")}
                  >
                    ×
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-800 font-body mb-2">Audio Clip</label>
            <div className="flex items-center gap-2 mt-1">
              <input 
                type="file" 
                accept="audio/*" 
                ref={audioInputRef} 
                className="text-sm file:mr-2 file:py-2 file:px-3 file:rounded-md file:border-0 file:bg-gray-100 hover:file:bg-gray-200 font-body border border-gray-300 p-2 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
              />
              {entry.audioUrl && (
                <>
                  <audio src={entry.audioUrl} controls className="h-10 rounded-md" />
                  <button 
                    type="button" 
                    className="text-red-600 hover:text-red-700 font-bold text-lg transition-colors" 
                    onClick={() => handleRemoveFile("audioUrl")}
                  >
                    ×
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="w-full md:w-auto pt-2">
        <button 
          type="button" 
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-md font-semibold w-full md:w-auto disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 shadow-sm" 
          onClick={handleSave} 
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Entry"}
        </button>
      </div>
    </div>
  );
}


// =============================================================
//  2. KOMPONEN INDUK: Komponen utama halaman Anda
// =============================================================
export default function TuneTrackerDashboard() {
  const { data: session } = useSession();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isMusic = session && ["MUSIC", "DEVELOPER"].includes(session.user.role);

  const fetchEntries = async () => {
    if (!loading) setLoading(true); // Tampilkan loading saat refresh
    setError("");
    try {
      const res = await fetch("/api/tune-tracker");
      const data = await res.json();
      const filled = Array.from({ length: MAX_ENTRIES }, (_, i) => {
        const found = data.find((e) => e.order === i + 1);
        return found || { order: i + 1, title: "", artist: "", coverImage: "", audioUrl: "", id: undefined };
      });
      setEntries(filled);
    } catch (err) {
      setError("Failed to load entries. Please refresh the page.");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isMusic) return <div className="p-8 text-center text-red-500 font-body">Access Denied.</div>;
  if (loading && entries.length === 0) return <div className="p-8 text-center font-body">Loading entries...</div>;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-heading font-bold mb-2 text-gray-900">Tune Tracker Editor</h1>
      <p className="mb-6 text-gray-600 font-body">Edit the top 10 music charts. Each entry is saved individually.</p>
      
      {error && <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-6 font-body">{error}</div>}
      
      <div className="space-y-6">
        {entries.map((entry) => (
          <TuneEntryForm
            key={entry.order}
            initialEntry={entry}
            onSaveSuccess={fetchEntries} // Kirim fungsi fetchEntries sebagai properti
          />
        ))}
      </div>
    </div>
  );
}
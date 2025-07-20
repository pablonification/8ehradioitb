"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import { FiSave, FiUpload, FiX, FiMusic } from "react-icons/fi";
import { hasAnyRole } from '@/lib/roleUtils';

const MAX_ENTRIES = 10;

// Komponen untuk satu baris entri lagu
function TuneEntryForm({ initialEntry, onSaveSuccess }) {
  const [entry, setEntry] = useState(initialEntry);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const coverInputRef = useRef(null);
  const audioInputRef = useRef(null);

  const handleChange = (field, value) => {
    setEntry((prev) => ({ ...prev, [field]: value }));
    setSuccess("");
    setError("");
  };

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      handleChange(field, file);
    }
  };
  
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
      handleChange(field, null); // Clear the file field
      setSuccess("File removed.");
      onSaveSuccess(); // Refresh parent state
    } catch (err) {
      setError(err.message);
    }
  };

  const uploadFile = async (file, type) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);
    const res = await fetch("/api/tune-tracker/upload", { method: "POST", body: formData });
    if (!res.ok) throw new Error(`Upload ${type} failed.`);
    const data = await res.json();
    return data.key;
  };

  const handleSave = async () => {
    if (!entry.title || !entry.artist) {
        setError("Song Title and Artist are required.");
        return;
    }
    setSaving(true);
    setError("");
    setSuccess("");
    
    let finalPayload = { ...entry };

    try {
      if (entry.coverImage instanceof File) {
        const coverUrl = await uploadFile(entry.coverImage, "cover");
        finalPayload.coverImage = coverUrl;
      }
      if (entry.audioUrl instanceof File) {
        const audioUrl = await uploadFile(entry.audioUrl, "audio");
        finalPayload.audioUrl = audioUrl;
      }
  
      const res = await fetch("/api/tune-tracker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalPayload),
      });
  
      if (!res.ok) throw new Error("Failed to save entry.");
      setSuccess("Entry saved successfully!");
      if (onSaveSuccess) onSaveSuccess();

    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 flex flex-col md:flex-row gap-6 items-start">
      <div className="w-12 text-3xl font-heading text-gray-400 pt-2 font-bold flex-shrink-0">{String(entry.order).padStart(2, "0")}</div>
      
      <div className="flex-1 w-full">
        {error && <div className="text-red-600 mb-3 text-sm font-body bg-red-50 p-3 rounded-md">{error}</div>}
        {success && <div className="text-green-600 mb-3 text-sm font-body bg-green-50 p-3 rounded-md">{success}</div>}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 font-body mb-1">Song Title</label>
            <input 
              className="w-full border border-gray-300 p-2 rounded-md font-body text-gray-900 bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500" 
              value={entry.title || ''} 
              onChange={(e) => handleChange("title", e.target.value)} 
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 font-body mb-1">Artist</label>
            <input 
              className="w-full border border-gray-300 p-2 rounded-md font-body text-gray-900 bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500" 
              value={entry.artist || ''} 
              onChange={(e) => handleChange("artist", e.target.value)} 
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 font-body mb-1">Cover Image</label>
            <div className="flex items-center gap-3">
              <label className="flex-1">
                <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, "coverImage")} className="hidden"/>
                <div className="w-full border border-gray-300 p-2 rounded-md font-body text-gray-600 bg-white hover:bg-gray-50 flex items-center gap-2 cursor-pointer">
                    <FiUpload />
                    <span className="truncate text-sm">{entry.coverImage instanceof File ? entry.coverImage.name : 'Choose file...'}</span>
                </div>
              </label>
              {typeof entry.coverImage === 'string' && entry.coverImage && (
                <>
                  <img src={entry.coverImage} alt="cover" className="w-12 h-12 object-cover rounded-md border" />
                  <button type="button" className="p-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-full cursor-pointer" onClick={() => handleRemoveFile("coverImage")}><FiX /></button>
                </>
              )}
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 font-body mb-1">Audio Clip (Preview)</label>
            <div className="flex items-center gap-3">
              <label className="flex-1">
                <input type="file" accept="audio/*" onChange={(e) => handleFileChange(e, "audioUrl")} className="hidden"/>
                 <div className="w-full border border-gray-300 p-2 rounded-md font-body text-gray-600 bg-white hover:bg-gray-50 flex items-center gap-2 cursor-pointer">
                    <FiMusic />
                    <span className="truncate text-sm">{entry.audioUrl instanceof File ? entry.audioUrl.name : 'Choose file...'}</span>
                </div>
              </label>
              {typeof entry.audioUrl === 'string' && entry.audioUrl && (
                <>
                  <audio src={`/api/proxy-audio?key=${encodeURIComponent(entry.audioUrl)}`} controls className="h-10 rounded-md" />
                  <button type="button" className="p-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-full cursor-pointer" onClick={() => handleRemoveFile("audioUrl")}><FiX /></button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="w-full md:w-auto pt-2 md:pt-8">
        <button 
          type="button" 
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-md font-semibold w-full md:w-auto flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-sm cursor-pointer" 
          onClick={handleSave} 
          disabled={saving}
        >
          <FiSave />
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}

// Komponen utama halaman
export default function TuneTrackerDashboard() {
  const { data: session } = useSession();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isMusic = session && hasAnyRole(session.user.role, ["MUSIC", "DEVELOPER"]);

  const fetchEntries = async () => {
    if (!loading) setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/tune-tracker");
      const data = await res.json();
      const filled = Array.from({ length: MAX_ENTRIES }, (_, i) => {
        const found = data.find((e) => e.order === i + 1);
        return found || { order: i + 1, title: "", artist: "", coverImage: null, audioUrl: null, id: undefined };
      });
      setEntries(filled);
    } catch (err) {
      setError("Failed to load entries. Please refresh the page.");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isMusic) {
      fetchEntries();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMusic]);

  if (!isMusic) {
      return <div className="p-8 text-center text-red-500 font-body">Access Denied.</div>;
  }

  if (loading) {
      return <div className="p-8 text-center font-body">Loading entries...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold mb-2 text-gray-900">Tune Tracker Editor</h1>
          <p className="text-gray-600 font-body">Edit the top 10 music charts. Each entry is saved individually.</p>
      </div>
      
      {error && <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-6 font-body">{error}</div>}
      
      <div className="space-y-6">
        {entries.map((entry) => (
          <TuneEntryForm
            key={entry.order}
            initialEntry={entry}
            onSaveSuccess={fetchEntries}
          />
        ))}
      </div>
    </div>
  );
}
"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import { FiSave, FiUpload, FiX, FiMusic, FiSearch } from "react-icons/fi";
import { hasAnyRole } from "@/lib/roleUtils";

const MAX_ENTRIES = 10;

function MetaEditor() {
  const [meta, setMeta] = useState({ curatedBy: "", editionDate: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const res = await fetch("/api/tune-tracker/meta");
        if (res.ok) {
          const data = await res.json();
          if (data) {
            setMeta({
              curatedBy: data.curatedBy || "",
              editionDate: data.editionDate
                ? new Date(data.editionDate).toISOString().split("T")[0]
                : "",
            });
          }
        }
      } catch (err) {
        console.error("Failed to fetch meta", err);
      }
    };
    fetchMeta();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/tune-tracker/meta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(meta),
      });
      if (!res.ok) throw new Error("Failed to save meta information.");
      setSuccess("Meta information saved successfully!");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-8">
      <h2 className="text-xl font-heading font-bold mb-4 text-gray-900">
        Chart Metadata
      </h2>

      {error && (
        <div className="text-red-600 mb-3 text-sm font-body bg-red-50 p-3 rounded-md">
          {error}
        </div>
      )}
      {success && (
        <div className="text-green-600 mb-3 text-sm font-body bg-green-50 p-3 rounded-md">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 font-body mb-1">
            Curated By
          </label>
          <input
            className="w-full border border-gray-300 p-2 rounded-md font-body text-gray-900 bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
            value={meta.curatedBy}
            onChange={(e) => {
              setMeta({ ...meta, curatedBy: e.target.value });
              setSuccess("");
              setError("");
            }}
            placeholder="e.g. Music Director"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 font-body mb-1">
            Edition Date
          </label>
          <input
            type="date"
            className="w-full border border-gray-300 p-2 rounded-md font-body text-gray-900 bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
            value={meta.editionDate}
            onChange={(e) => {
              setMeta({ ...meta, editionDate: e.target.value });
              setSuccess("");
              setError("");
            }}
          />
        </div>
      </div>

      <button
        type="button"
        className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-md font-semibold flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-sm cursor-pointer"
        onClick={handleSave}
        disabled={saving}
      >
        <FiSave />
        {saving ? "Saving..." : "Save Metadata"}
      </button>
    </div>
  );
}

// Komponen untuk satu baris entri lagu
function TuneEntryForm({ initialEntry, onSaveSuccess }) {
  const [entry, setEntry] = useState({
    ...initialEntry,
    sourceType: initialEntry.sourceType || "MANUAL",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // iTunes Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    setEntry({
      ...initialEntry,
      sourceType: initialEntry.sourceType || "MANUAL",
    });
  }, [initialEntry]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setShowDropdown(true);
    try {
      const res = await fetch("/api/itunes/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery }),
      });
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setSearchResults(data.items || []);
    } catch (err) {
      console.error(err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectResult = async (item) => {
    setError("");
    setSuccess("");

    const shouldRemovePersistedAudio =
      Boolean(entry?.id) &&
      typeof entry?.audioUrl === "string" &&
      entry.audioUrl.trim().length > 0;

    if (shouldRemovePersistedAudio) {
      try {
        const res = await fetch("/api/tune-tracker", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: entry.id, field: "audioUrl" }),
        });
        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          throw new Error(payload?.error || "Failed to remove previous audio file.");
        }
      } catch (err) {
        setError(err.message || "Failed to remove previous audio file.");
        return;
      }
    }

    setEntry((prev) => ({
      ...prev,
      title: item.title,
      artist: item.artist,
      coverImage: item.artworkUrl,
      itunesPreviewUrl: item.previewUrl,
      itunesTrackId: item.trackId,
      sourceType: "ITUNES",
      audioUrl: null, // Clear manual audio if any
    }));
    setShowDropdown(false);
    setSearchQuery("");
    setSuccess("iTunes track selected.");
    if (shouldRemovePersistedAudio && onSaveSuccess) {
      onSaveSuccess();
    }
  };

  const handleClearItunes = () => {
    setEntry((prev) => ({
      ...prev,
      itunesPreviewUrl: null,
      itunesTrackId: null,
      sourceType: prev.audioUrl ? "AUDIO_URL" : "MANUAL",
    }));
  };

  const handleChange = (field, value) => {
    setEntry((prev) => ({ ...prev, [field]: value }));
    setSuccess("");
    setError("");
  };

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      if (field === "audioUrl") {
        setEntry((prev) => ({
          ...prev,
          audioUrl: file,
          sourceType: "AUDIO_URL",
          itunesPreviewUrl: null,
          itunesTrackId: null,
        }));
      } else {
        handleChange(field, file);
      }
      setSuccess("");
      setError("");
    }
  };

  const handleRemoveFile = async (field) => {
    setError("");
    setSuccess("");
    if (!entry.id) {
      handleChange(field, null);
      if (field === "audioUrl") {
        handleChange(
          "sourceType",
          entry.itunesPreviewUrl ? "ITUNES" : "MANUAL",
        );
      }
      return;
    }
    try {
      const res = await fetch("/api/tune-tracker", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: entry.id, field }),
      });
      if (!res.ok) throw new Error("Failed to remove file.");
      handleChange(field, null);
      if (field === "audioUrl") {
        handleChange(
          "sourceType",
          entry.itunesPreviewUrl ? "ITUNES" : "MANUAL",
        );
      }
      setSuccess("File removed.");
      onSaveSuccess();
    } catch (err) {
      setError(err.message);
    }
  };

  const uploadFile = async (file, type) => {
    const res = await fetch("/api/tune-tracker/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
        type,
      }),
    });
    if (!res.ok) throw new Error(`Failed to get upload URL for ${type}`);
    const { uploadUrl, key } = await res.json();

    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });
    if (!uploadRes.ok)
      throw new Error(`Direct upload to R2 failed for ${type}`);
    return key;
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

  const isItunesSource =
    entry.sourceType === "ITUNES" || !!entry.itunesPreviewUrl;

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 flex flex-col md:flex-row gap-6 items-start">
      <div className="w-12 text-3xl font-heading text-gray-400 pt-2 font-bold flex-shrink-0">
        {String(entry.order).padStart(2, "0")}
      </div>

      <div className="flex-1 w-full">
        {error && (
          <div className="text-red-600 mb-3 text-sm font-body bg-red-50 p-3 rounded-md">
            {error}
          </div>
        )}
        {success && (
          <div className="text-green-600 mb-3 text-sm font-body bg-green-50 p-3 rounded-md">
            {success}
          </div>
        )}

        {/* iTunes Search Bar */}
        <div className="mb-6 relative" ref={dropdownRef}>
          <label className="block text-sm font-semibold text-gray-700 font-body mb-1">
            Search iTunes
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              className="flex-1 border border-gray-300 p-2 rounded-md font-body text-gray-900 bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder="Search for a song..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <button
              type="button"
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md font-semibold flex items-center gap-2 transition-colors border border-gray-300 cursor-pointer"
              onClick={handleSearch}
              disabled={isSearching}
            >
              <FiSearch />
              {isSearching ? "Searching..." : "Search"}
            </button>
          </div>

          {/* Search Results Dropdown */}
          {showDropdown && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {isSearching ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  Searching...
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map((item) => (
                  <div
                    key={item.trackId}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0"
                    onClick={() => handleSelectResult(item)}
                  >
                    {item.artworkUrl ? (
                      <img
                        src={item.artworkUrl}
                        alt={item.title}
                        className="w-10 h-10 rounded object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                        <FiMusic className="text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-gray-900 truncate">
                        {item.title}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {item.artist} &bull; {item.album}
                      </div>
                    </div>
                  </div>
                ))
              ) : searchQuery ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  No results found
                </div>
              ) : null}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 mb-4">
          <span
            className={`text-xs font-bold px-2 py-1 rounded-full ${isItunesSource ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}`}
          >
            {isItunesSource ? "iTunes Source" : "Manual Upload"}
          </span>
          {isItunesSource && (
            <button
              type="button"
              onClick={handleClearItunes}
              className="text-xs text-red-500 hover:text-red-700 underline cursor-pointer"
            >
              Clear iTunes Selection
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 font-body mb-1">
              Song Title
            </label>
            <input
              className="w-full border border-gray-300 p-2 rounded-md font-body text-gray-900 bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
              value={entry.title || ""}
              onChange={(e) => handleChange("title", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 font-body mb-1">
              Artist
            </label>
            <input
              className="w-full border border-gray-300 p-2 rounded-md font-body text-gray-900 bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
              value={entry.artist || ""}
              onChange={(e) => handleChange("artist", e.target.value)}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 font-body mb-1">
              Cover Image
            </label>
            <div className="flex items-center gap-3">
              <label className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, "coverImage")}
                  className="hidden"
                />
                <div className="w-full border border-gray-300 p-2 rounded-md font-body text-gray-600 bg-white hover:bg-gray-50 flex items-center gap-2 cursor-pointer">
                  <FiUpload />
                  <span className="truncate text-sm">
                    {entry.coverImage instanceof File
                      ? entry.coverImage.name
                      : "Choose file..."}
                  </span>
                </div>
              </label>
              {typeof entry.coverImage === "string" && entry.coverImage && (
                <>
                  <img
                    src={
                      entry.coverImage.startsWith("http")
                        ? entry.coverImage
                        : `/api/proxy-audio?key=${encodeURIComponent(entry.coverImage)}`
                    }
                    alt="cover"
                    className="w-12 h-12 object-cover rounded-md border"
                  />
                  <button
                    type="button"
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-full cursor-pointer"
                    onClick={() => handleRemoveFile("coverImage")}
                  >
                    <FiX />
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 font-body mb-1">
              Audio Clip (Preview)
            </label>
            <div className="flex flex-col gap-2">
              <label className="flex-1">
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => handleFileChange(e, "audioUrl")}
                  className="hidden"
                />
                <div className="w-full border border-gray-300 p-2 rounded-md font-body text-gray-600 bg-white hover:bg-gray-50 flex items-center gap-2 cursor-pointer">
                  <FiMusic />
                  <span className="truncate text-sm">
                    {entry.audioUrl instanceof File
                      ? entry.audioUrl.name
                      : "Choose file..."}
                  </span>
                </div>
              </label>

              {/* Manual Audio Preview */}
              {typeof entry.audioUrl === "string" && entry.audioUrl && (
                <div className="flex items-center gap-3 mt-1">
                  <audio
                    src={`/api/proxy-audio?key=${encodeURIComponent(entry.audioUrl)}`}
                    controls
                    className="h-10 rounded-md"
                  />
                  <button
                    type="button"
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-full cursor-pointer"
                    onClick={() => handleRemoveFile("audioUrl")}
                  >
                    <FiX />
                  </button>
                </div>
              )}

              {/* iTunes Audio Preview */}
              {entry.itunesPreviewUrl && !entry.audioUrl && (
                <div className="flex items-center gap-3 mt-1">
                  <audio
                    src={entry.itunesPreviewUrl}
                    controls
                    className="h-10 rounded-md"
                  />
                </div>
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

  const isMusic =
    session && hasAnyRole(session.user.role, ["MUSIC", "DEVELOPER"]);

  const fetchEntries = async () => {
    if (!loading) setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/tune-tracker");
      const data = await res.json();
      const filled = Array.from({ length: MAX_ENTRIES }, (_, i) => {
        const found = data.find((e) => e.order === i + 1);
        return (
          found || {
            order: i + 1,
            title: "",
            artist: "",
            coverImage: null,
            audioUrl: null,
            itunesPreviewUrl: null,
            itunesTrackId: null,
            sourceType: "MANUAL",
            id: undefined,
          }
        );
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
    return (
      <div className="p-8 text-center text-red-500 font-body">
        Access Denied.
      </div>
    );
  }

  if (loading) {
    return <div className="p-8 text-center font-body">Loading entries...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold mb-2 text-gray-900">
          Tune Tracker Editor
        </h1>
        <p className="text-gray-600 font-body">
          Edit the top 10 music charts. Each entry is saved individually.
        </p>
      </div>

      <MetaEditor />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-6 font-body">
          {error}
        </div>
      )}

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

"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import {
  FiSave,
  FiUpload,
  FiX,
  FiMusic,
  FiPlay,
  FiStopCircle,
  FiYoutube,
  FiRefreshCw,
} from "react-icons/fi";
import { hasAnyRole } from "@/lib/roleUtils";

const MAX_ENTRIES = 10;

const formatTime = (seconds) => {
  if (seconds === null || seconds === undefined || isNaN(seconds)) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const parseTime = (timeStr) => {
  if (!timeStr) return null;
  const parts = timeStr.trim().split(":");
  if (parts.length === 1) {
    const val = parseInt(parts[0], 10);
    return isNaN(val) ? null : val;
  }
  if (parts.length === 2) {
    const m = parseInt(parts[0], 10);
    const s = parseInt(parts[1], 10);
    if (isNaN(m) || isNaN(s)) return null;
    return m * 60 + s;
  }
  return null;
};

// Komponen untuk satu baris entri lagu
function TuneEntryForm({ initialEntry, onSaveSuccess }) {
  const [entry, setEntry] = useState(initialEntry);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [mode, setMode] = useState(
    entry.sourceType === "AUDIO_URL" ||
      (entry.audioUrl && !entry.youtubeVideoId)
      ? "AUDIO_URL"
      : "YOUTUBE",
  );

  const [previewing, setPreviewing] = useState(false);
  const [fetchingMeta, setFetchingMeta] = useState(false);

  useEffect(() => {
    setEntry((prev) => ({ ...prev, sourceType: mode }));
  }, [mode]);

  const handleChange = (field, value) => {
    setEntry((prev) => ({ ...prev, [field]: value }));
    setSuccess("");
    setError("");
    if (
      field === "youtubeUrl" ||
      field === "startSeconds" ||
      field === "endSeconds"
    ) {
      setPreviewing(false);
    }
  };

  const handleTimeChange = (field, value) => {
    const seconds = parseTime(value);
    if (seconds !== null) {
      handleChange(field, seconds);
    }
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

  const fetchYoutubeMetadata = async () => {
    const url = entry.youtubeUrl || entry.youtubeVideoId;
    if (!url) {
      setError("Please enter a YouTube URL or ID first.");
      return;
    }

    setFetchingMeta(true);
    setError("");

    try {
      const res = await fetch("/api/youtube/metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(url.length === 11 ? { id: url } : { url }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to fetch metadata");

      setEntry((prev) => ({
        ...prev,
        title: prev.title || data.title, // Only auto-fill if empty? or just overwrite? "If successful and title is empty, auto-fill title"
        youtubeVideoId: data.videoId,
        youtubeUrl: data.canonicalUrl,
        coverImage:
          !prev.coverImage ||
          typeof prev.coverImage !== "string" ||
          prev.coverImage.startsWith("http")
            ? data.thumbnailUrl
            : prev.coverImage, // "Set coverImage to YouTube thumbnail... as default". We'll set it if it's empty or currently an external URL. If user uploaded a custom file (R2 key), maybe keep it? Let's just set it if empty or currently a youtube thumb.
      }));

      // If we just fetched, and coverImage was empty, set it
      if (!entry.coverImage) {
        handleChange("coverImage", data.thumbnailUrl);
      } else if (
        typeof entry.coverImage === "string" &&
        entry.coverImage.startsWith("http")
      ) {
        // Overwrite existing external URL (likely old youtube thumb)
        handleChange("coverImage", data.thumbnailUrl);
      }

      setSuccess("Metadata fetched successfully");
    } catch (err) {
      setError(err.message);
    } finally {
      setFetchingMeta(false);
    }
  };

  const uploadFile = async (file, type) => {
    // Step 1: Get pre-signed URL from API
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

    // Step 2: Upload file directly to R2
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

    // Validation for YouTube mode
    if (mode === "YOUTUBE") {
      if (!entry.youtubeVideoId) {
        setError("YouTube Video ID is required for YouTube mode.");
        return;
      }
      if (entry.startSeconds === undefined || entry.startSeconds === null) {
        setError("Start time is required.");
        return;
      }
      if (entry.endSeconds === undefined || entry.endSeconds === null) {
        setError("End time is required.");
        return;
      }
      if (entry.endSeconds <= entry.startSeconds) {
        setError("End time must be greater than start time.");
        return;
      }
    } else {
      if (!entry.audioUrl) {
        setError("Audio file is required for Audio Upload mode.");
        return;
      }
    }

    setSaving(true);
    setError("");
    setSuccess("");

    let finalPayload = {
      ...entry,
      sourceType: mode,
      // Ensure numbers are numbers
      startSeconds:
        entry.startSeconds !== "" ? parseInt(entry.startSeconds) : null,
      endSeconds: entry.endSeconds !== "" ? parseInt(entry.endSeconds) : null,
    };

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

  const getCoverSrc = (img) => {
    if (!img || img instanceof File) return null;
    if (img.startsWith("http")) return img;
    return `/api/proxy-audio?key=${encodeURIComponent(img)}`;
  };

  const togglePreview = () => {
    setPreviewing(!previewing);
  };

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

        {/* Mode Toggle */}
        <div className="flex mb-4 border-b border-gray-200">
          <button
            className={`pb-2 px-4 font-semibold text-sm ${mode === "YOUTUBE" ? "text-red-600 border-b-2 border-red-600" : "text-gray-500 hover:text-gray-700"}`}
            onClick={() => setMode("YOUTUBE")}
          >
            <div className="flex items-center gap-2">
              <FiYoutube /> YouTube
            </div>
          </button>
          <button
            className={`pb-2 px-4 font-semibold text-sm ${mode === "AUDIO_URL" ? "text-red-600 border-b-2 border-red-600" : "text-gray-500 hover:text-gray-700"}`}
            onClick={() => setMode("AUDIO_URL")}
          >
            <div className="flex items-center gap-2">
              <FiMusic /> Audio Upload
            </div>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* YouTube Specific Inputs */}
          {mode === "YOUTUBE" && (
            <div className="md:col-span-2 space-y-4">
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-700 font-body mb-1">
                    YouTube URL / ID
                  </label>
                  <input
                    className="w-full border border-gray-300 p-2 rounded-md font-body text-gray-900 bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    value={entry.youtubeUrl || entry.youtubeVideoId || ""}
                    onChange={(e) => handleChange("youtubeUrl", e.target.value)}
                    onBlur={() => {
                      // Optional: simple format check on blur
                    }}
                    placeholder="https://youtube.com/watch?v=..."
                  />
                </div>
                <button
                  type="button"
                  onClick={fetchYoutubeMetadata}
                  disabled={fetchingMeta}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 p-2.5 rounded-md border border-gray-300 flex items-center gap-2 font-semibold disabled:opacity-50"
                >
                  {fetchingMeta ? (
                    <FiRefreshCw className="animate-spin" />
                  ) : (
                    <FiRefreshCw />
                  )}
                  Fetch
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 font-body mb-1">
                    Start Time (mm:ss)
                  </label>
                  <input
                    className="w-full border border-gray-300 p-2 rounded-md font-body text-gray-900 bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    key={entry.startSeconds}
                    defaultValue={formatTime(entry.startSeconds)}
                    onBlur={(e) =>
                      handleTimeChange("startSeconds", e.target.value)
                    }
                    placeholder="0:00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 font-body mb-1">
                    End Time (mm:ss)
                  </label>
                  <input
                    className="w-full border border-gray-300 p-2 rounded-md font-body text-gray-900 bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    key={entry.endSeconds}
                    defaultValue={formatTime(entry.endSeconds)}
                    onBlur={(e) =>
                      handleTimeChange("endSeconds", e.target.value)
                    }
                    placeholder="0:30"
                  />
                </div>
              </div>

              {/* Preview Button */}
              {entry.youtubeVideoId &&
                entry.startSeconds != null &&
                entry.endSeconds != null && (
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={togglePreview}
                      className={`flex items-center gap-2 px-4 py-2 rounded-md font-semibold text-sm ${previewing ? "bg-red-100 text-red-700 border border-red-200" : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300"}`}
                    >
                      {previewing ? <FiStopCircle /> : <FiPlay />}
                      {previewing ? "Stop Preview" : "Preview Segment"}
                    </button>

                    {/* Hidden iframe for audio playback */}
                    {previewing && (
                      <div className="mt-2 rounded-md overflow-hidden bg-black h-0 w-0 opacity-0 relative">
                        <iframe
                          width="0"
                          height="0"
                          src={`https://www.youtube.com/embed/${entry.youtubeVideoId}?start=${entry.startSeconds}&end=${entry.endSeconds}&autoplay=1&controls=0&modestbranding=1&rel=0`}
                          title="YouTube video player"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                      </div>
                    )}
                  </div>
                )}
            </div>
          )}

          {/* Basic Info */}
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
              Cover Image{" "}
              {mode === "YOUTUBE" && (
                <span className="text-gray-400 font-normal ml-2">
                  (Default: YouTube Thumbnail)
                </span>
              )}
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
                      : "Upload Custom Cover..."}
                  </span>
                </div>
              </label>
              {(entry.coverImage instanceof File || entry.coverImage) && (
                <>
                  <div className="relative">
                    {entry.coverImage instanceof File ? (
                      // Display nothing for file object preview in this simplified view or maybe just the name above is enough.
                      // Actually let's try to create a URL for preview if it's a file
                      <div className="w-12 h-12 bg-gray-100 rounded-md border flex items-center justify-center text-xs text-gray-500">
                        File
                      </div>
                    ) : (
                      <img
                        src={getCoverSrc(entry.coverImage)}
                        alt="cover"
                        className="w-12 h-12 object-cover rounded-md border"
                      />
                    )}
                  </div>
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

          {/* Audio Upload (Legacy) - Only show in AUDIO_URL mode */}
          {mode === "AUDIO_URL" && (
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
              </div>
            </div>
          )}
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
            youtubeUrl: "",
            youtubeVideoId: "",
            startSeconds: null,
            endSeconds: null,
            sourceType: "YOUTUBE",
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

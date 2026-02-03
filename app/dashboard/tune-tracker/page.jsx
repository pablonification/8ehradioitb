"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import {
  FiSave,
  FiUpload,
  FiX,
  FiMusic,
  FiPlay,
  FiPause,
  FiYoutube,
  FiRefreshCw,
  FiSearch,
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

const TimelineEditor = ({
  duration,
  start,
  end,
  onChange,
  isPlaying,
  onTogglePlay,
}) => {
  const containerRef = useRef(null);
  const [dragging, setDragging] = useState(null);

  const getPercentage = (time) => {
    if (!duration) return 0;
    return Math.min(100, Math.max(0, (time / duration) * 100));
  };

  const handleMouseDown = (type) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(type);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!dragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.min(100, Math.max(0, (x / rect.width) * 100));
      let time = Math.round((percentage / 100) * duration);
      time = Math.max(0, Math.min(duration, time));

      if (dragging === "start") {
        if (time < end) onChange(time, end);
      } else {
        if (time > start) onChange(start, time);
      }
    };

    const handleMouseUp = () => {
      setDragging(null);
    };

    if (dragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging, duration, start, end, onChange]);

  if (!duration) return null;

  const left = getPercentage(start);
  const right = getPercentage(end);
  const width = right - left;

  return (
    <div className="mt-4 select-none">
      <div className="flex justify-between text-xs text-gray-500 mb-2 font-mono items-center">
        <span>Start: {formatTime(start)}</span>
        <button
          type="button"
          onClick={onTogglePlay}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
            isPlaying
              ? "bg-red-100 text-red-600 hover:bg-red-200"
              : "bg-red-600 text-white hover:bg-red-700"
          }`}
          title={isPlaying ? "Stop" : "Play segment"}
        >
          {isPlaying ? (
            <FiPause size={16} />
          ) : (
            <FiPlay size={16} className="ml-0.5" />
          )}
        </button>
        <span>End: {formatTime(end)}</span>
      </div>
      <div
        ref={containerRef}
        className="relative h-8 bg-gray-200 rounded-full cursor-pointer touch-none"
      >
        <div
          className="absolute top-0 h-full bg-red-200 border-y border-red-300"
          style={{ left: `${left}%`, width: `${width}%` }}
        />

        <div
          className="absolute top-0 w-6 h-8 bg-white border-2 border-red-600 rounded-full cursor-ew-resize hover:scale-110 transition-transform z-10 shadow-sm flex items-center justify-center"
          style={{ left: `${left}%`, transform: "translateX(-50%)" }}
          onMouseDown={handleMouseDown("start")}
        >
          <div className="w-1 h-3 bg-red-400 rounded-full" />
        </div>

        <div
          className="absolute top-0 w-6 h-8 bg-white border-2 border-red-600 rounded-full cursor-ew-resize hover:scale-110 transition-transform z-10 shadow-sm flex items-center justify-center"
          style={{ left: `${right}%`, transform: "translateX(-50%)" }}
          onMouseDown={handleMouseDown("end")}
        >
          <div className="w-1 h-3 bg-red-400 rounded-full" />
        </div>
      </div>
      <div className="flex justify-between text-xs text-gray-400 mt-1">
        <span>0:00</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
};

// Komponen untuk satu baris entri lagu
function TuneEntryForm({ initialEntry, onSaveSuccess }) {
  const [entry, setEntry] = useState(initialEntry);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [searchQuery, setSearchQuery] = useState(entry.youtubeUrl || "");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

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

  useEffect(() => {
    if (entry.youtubeVideoId && !searchQuery) {
      setSearchQuery(
        entry.youtubeUrl ||
          `https://youtube.com/watch?v=${entry.youtubeVideoId}`,
      );
    }
  }, [entry.youtubeVideoId]);

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
      handleChange(field, null);
      setSuccess("File removed.");
      onSaveSuccess();
    } catch (err) {
      setError(err.message);
    }
  };

  const performSearch = async () => {
    if (!searchQuery.trim()) return;

    const isUrl =
      searchQuery.includes("http") ||
      searchQuery.includes("youtube.com") ||
      searchQuery.includes("youtu.be");
    const isId = /^[a-zA-Z0-9_-]{11}$/.test(searchQuery);

    if (isUrl || isId) {
      fetchYoutubeMetadata(searchQuery);
      return;
    }

    setIsSearching(true);
    setSearchResults([]);
    setShowResults(true);
    setError("");

    try {
      const res = await fetch("/api/youtube/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Search failed");
      setSearchResults(data.items || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSearching(false);
    }
  };

  const fetchYoutubeMetadata = async (urlOrId) => {
    const input = urlOrId || entry.youtubeUrl || entry.youtubeVideoId;
    if (!input) {
      setError("Please enter a YouTube URL, ID, or search query.");
      return;
    }

    setFetchingMeta(true);
    setError("");

    try {
      const res = await fetch("/api/youtube/metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          input.length === 11 ? { id: input } : { url: input },
        ),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to fetch metadata");

      setEntry((prev) => ({
        ...prev,
        title: prev.title || data.title,
        youtubeVideoId: data.videoId,
        youtubeUrl: data.canonicalUrl,
        videoDuration: data.duration,
        coverImage:
          !prev.coverImage ||
          typeof prev.coverImage !== "string" ||
          prev.coverImage.startsWith("http")
            ? data.thumbnailUrl
            : prev.coverImage,
      }));

      if (input !== searchQuery) {
        setSearchQuery(data.canonicalUrl);
      }

      setSuccess("Metadata fetched successfully");
      setShowResults(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setFetchingMeta(false);
    }
  };

  const selectVideo = (video) => {
    fetchYoutubeMetadata(video.id);
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
          {mode === "YOUTUBE" && (
            <div className="md:col-span-2 space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 font-body">
                  Search YouTube or Paste URL
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      className="w-full border border-gray-300 p-2.5 pl-10 rounded-md font-body text-gray-900 bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          performSearch();
                        }
                      }}
                      placeholder="Search video or paste URL..."
                    />
                    <FiSearch className="absolute left-3 top-3 text-gray-400" />
                  </div>
                  <button
                    type="button"
                    onClick={performSearch}
                    disabled={isSearching || fetchingMeta}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 rounded-md font-semibold flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSearching || fetchingMeta ? (
                      <FiRefreshCw className="animate-spin" />
                    ) : (
                      <FiSearch />
                    )}
                    Search
                  </button>
                </div>

                {showResults && searchResults.length > 0 && (
                  <div className="mt-2 border border-gray-200 rounded-md bg-gray-50 max-h-60 overflow-y-auto">
                    {searchResults.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-2 hover:bg-white cursor-pointer border-b last:border-0 border-gray-100"
                        onClick={() => selectVideo(item)}
                      >
                        <img
                          src={item.thumbnailUrl}
                          alt=""
                          className="w-16 h-12 object-cover rounded"
                        />
                        <div>
                          <div className="text-sm font-semibold text-gray-900 line-clamp-1">
                            {item.title}
                          </div>
                          <div className="text-xs text-gray-500">
                            {item.channelTitle}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {entry.videoDuration ? (
                <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                  <label className="block text-sm font-semibold text-gray-700 font-body mb-2">
                    Select Segment
                  </label>
                  <TimelineEditor
                    duration={entry.videoDuration}
                    start={entry.startSeconds || 0}
                    end={entry.endSeconds || entry.videoDuration}
                    onChange={(s, e) => {
                      handleChange("startSeconds", s);
                      handleChange("endSeconds", e);
                    }}
                    isPlaying={previewing}
                    onTogglePlay={togglePreview}
                  />
                </div>
              ) : (
                entry.youtubeVideoId && (
                  <div className="text-sm text-gray-500 bg-yellow-50 p-2 rounded">
                    Video duration unknown. Please click "Search" or "Fetch" to
                    update metadata.
                  </div>
                )
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 font-body mb-1">
                    Start Time (mm:ss)
                  </label>
                  <input
                    className="w-full border border-gray-300 p-2 rounded-md font-body text-gray-900 bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    key={entry.startSeconds}
                    value={formatTime(entry.startSeconds)}
                    onChange={(e) =>
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
                    value={formatTime(entry.endSeconds)}
                    onChange={(e) =>
                      handleTimeChange("endSeconds", e.target.value)
                    }
                    placeholder="0:30"
                  />
                </div>
              </div>

              {previewing && entry.youtubeVideoId && (
                <div className="rounded-md overflow-hidden bg-black aspect-video w-full max-w-md mx-auto">
                  <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${entry.youtubeVideoId}?start=${entry.startSeconds}&end=${entry.endSeconds}&autoplay=1&controls=0&modestbranding=1&rel=0`}
                    title="YouTube video player"
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              )}
            </div>
          )}

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
function MetaEditor() {
  const [meta, setMeta] = useState({ curatedBy: "", editionDate: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const fetchMeta = async () => {
    try {
      const res = await fetch("/api/tune-tracker/meta");
      const data = await res.json();
      setMeta({
        curatedBy: data.curatedBy || "",
        editionDate: data.editionDate
          ? new Date(data.editionDate).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
      });
    } catch (err) {
      console.error("Failed to load meta", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMeta();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/tune-tracker/meta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          curatedBy: meta.curatedBy,
          editionDate: meta.editionDate,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setMessage("Saved successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage("Error: " + err.message);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-8">
        <div className="text-gray-500 font-body">Loading metadata...</div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8 shadow-sm">
      <h2 className="text-lg font-heading font-semibold mb-4 text-gray-900">
        Chart Metadata
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div>
          <label className="block text-sm font-semibold text-gray-700 font-body mb-1">
            Curated by
          </label>
          <input
            type="text"
            className="w-full border border-gray-300 p-2 rounded-md font-body text-gray-900 bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
            value={meta.curatedBy}
            onChange={(e) =>
              setMeta((prev) => ({ ...prev, curatedBy: e.target.value }))
            }
            placeholder="Enter curator name..."
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
            onChange={(e) =>
              setMeta((prev) => ({ ...prev, editionDate: e.target.value }))
            }
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-semibold flex items-center gap-2 disabled:bg-gray-400"
          >
            <FiSave />
            {saving ? "Saving..." : "Save Metadata"}
          </button>
          {message && (
            <span
              className={`text-sm font-body ${
                message.includes("Error") ? "text-red-600" : "text-green-600"
              }`}
            >
              {message}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

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

      <MetaEditor />

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

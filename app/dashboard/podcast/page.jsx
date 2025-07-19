'use client';

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";

function PodcastDashboard() {
  const { data: session } = useSession();
  const [podcasts, setPodcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ title: "", subtitle: "", description: "", date: "", duration: "", audio: null, coverImage: null, image: "" });
  const [submitting, setSubmitting] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    fetch("/api/podcast")
      .then((res) => res.json())
      .then((data) => {
        setPodcasts(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load podcasts");
        setLoading(false);
      });
  }, []);

  const isAdmin = session && ["DEVELOPER", "TECHNIC"].includes(session.user.role);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("subtitle", form.subtitle);
      formData.append("description", form.description);
      formData.append("date", form.date);
      formData.append("duration", form.duration);
      if (form.image) formData.append("image", form.image);
      if (form.audio) formData.append("audio", form.audio);
      if (form.coverImage) formData.append("coverImage", form.coverImage);
      const res = await fetch("/api/podcast", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to add podcast");
      const newPodcast = await res.json();
      setPodcasts((prev) => [newPodcast, ...prev]);
      setForm({ title: "", subtitle: "", description: "", date: "", duration: "", audio: null, coverImage: null, image: "" });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (podcast) => {
    setEditId(podcast.id);
    setEditForm({
      title: podcast.title || "",
      subtitle: podcast.subtitle || "",
      description: podcast.description || "",
      date: podcast.date || "",
      duration: podcast.duration || "",
      image: podcast.image || "",
    });
  };

  const handleEditSave = async (id) => {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/podcast", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...editForm }),
      });
      if (!res.ok) throw new Error("Failed to update podcast");
      const updated = await res.json();
      setPodcasts((prev) => prev.map((p) => (p.id === id ? updated : p)));
      setEditId(null);
      setEditForm({});
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this podcast?")) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/podcast", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Failed to delete podcast");
      setPodcasts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-heading font-bold mb-4 text-gray-900">Podcast Dashboard</h1>
      {isAdmin && (
        <form onSubmit={handleSubmit} className="mb-8 space-y-4 bg-gray-50 p-6 rounded-lg shadow-md border border-gray-200">
          <div>
            <label className="block font-semibold font-body text-gray-800 mb-2">Title</label>
            <input 
              name="title" 
              value={form.title} 
              onChange={handleChange} 
              className="w-full border border-gray-300 p-3 rounded-md font-body text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
              required 
            />
          </div>
          <div>
            <label className="block font-semibold font-body text-gray-800 mb-2">Subtitle (optional)</label>
            <input 
              name="subtitle" 
              value={form.subtitle} 
              onChange={handleChange} 
              className="w-full border border-gray-300 p-3 rounded-md font-body text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
            />
          </div>
          <div>
            <label className="block font-semibold font-body text-gray-800 mb-2">Description</label>
            <textarea 
              name="description" 
              value={form.description} 
              onChange={handleChange} 
              className="w-full border border-gray-300 p-3 rounded-md font-body text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
              required 
            />
          </div>
          <div>
            <label className="block font-semibold font-body text-gray-800 mb-2">Date (e.g. Dec 7, 2024)</label>
            <input 
              name="date" 
              value={form.date} 
              onChange={handleChange} 
              className="w-full border border-gray-300 p-3 rounded-md font-body text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
            />
          </div>
          <div>
            <label className="block font-semibold font-body text-gray-800 mb-2">Duration (e.g. 33 min 40 sec)</label>
            <input 
              name="duration" 
              value={form.duration} 
              onChange={handleChange} 
              className="w-full border border-gray-300 p-3 rounded-md font-body text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
            />
          </div>
          <div>
            <label className="block font-semibold font-body text-gray-800 mb-2">Image URL (optional, overrides cover image)</label>
            <input 
              name="image" 
              value={form.image} 
              onChange={handleChange} 
              className="w-full border border-gray-300 p-3 rounded-md font-body text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
            />
          </div>
          <div>
            <label className="block font-semibold font-body text-gray-800 mb-2">Audio File</label>
            <input 
              name="audio" 
              type="file" 
              accept="audio/*" 
              onChange={handleChange} 
              className="w-full border border-gray-300 p-3 rounded-md font-body text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors file:mr-2 file:py-2 file:px-3 file:rounded-md file:border-0 file:bg-gray-100 hover:file:bg-gray-200" 
              required 
            />
          </div>
          <div>
            <label className="block font-semibold font-body text-gray-800 mb-2">Cover Image (optional)</label>
            <input 
              name="coverImage" 
              type="file" 
              accept="image/*" 
              onChange={handleChange} 
              className="w-full border border-gray-300 p-3 rounded-md font-body text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors file:mr-2 file:py-2 file:px-3 file:rounded-md file:border-0 file:bg-gray-100 hover:file:bg-gray-200" 
            />
          </div>
          <button 
            type="submit" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-body font-semibold transition-colors duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed" 
            disabled={submitting}
          >
            {submitting ? "Adding..." : "Add Podcast"}
          </button>
          {error && <div className="text-red-700 mt-2 font-body bg-red-50 border border-red-200 rounded-md p-3">{error}</div>}
        </form>
      )}
      <h2 className="text-xl font-heading font-semibold mb-4 text-gray-900">All Podcasts</h2>
      {loading ? (
        <div className="text-center font-body text-gray-700">Loading...</div>
      ) : error ? (
        <div className="text-red-700 font-body bg-red-50 border border-red-200 rounded-md p-3">{error}</div>
      ) : (
        <ul className="space-y-4">
          {podcasts.map((podcast) => (
            <li key={podcast.id} className="border border-gray-200 p-6 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
              {editId === podcast.id ? (
                <div className="space-y-3">
                  <input 
                    name="title" 
                    value={editForm.title} 
                    onChange={handleEditChange} 
                    className="w-full border border-gray-300 p-3 rounded-md font-body text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                  />
                  <input 
                    name="subtitle" 
                    value={editForm.subtitle} 
                    onChange={handleEditChange} 
                    className="w-full border border-gray-300 p-3 rounded-md font-body text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                  />
                  <textarea 
                    name="description" 
                    value={editForm.description} 
                    onChange={handleEditChange} 
                    className="w-full border border-gray-300 p-3 rounded-md font-body text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                  />
                  <input 
                    name="date" 
                    value={editForm.date} 
                    onChange={handleEditChange} 
                    className="w-full border border-gray-300 p-3 rounded-md font-body text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                  />
                  <input 
                    name="duration" 
                    value={editForm.duration} 
                    onChange={handleEditChange} 
                    className="w-full border border-gray-300 p-3 rounded-md font-body text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                  />
                  <input 
                    name="image" 
                    value={editForm.image} 
                    onChange={handleEditChange} 
                    className="w-full border border-gray-300 p-3 rounded-md font-body text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                  />
                  <div className="flex gap-2 mt-3">
                    <button 
                      onClick={() => handleEditSave(podcast.id)} 
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-body font-semibold transition-colors duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed" 
                      disabled={submitting}
                    >
                      Save
                    </button>
                    <button 
                      onClick={() => setEditId(null)} 
                      className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-md font-body font-semibold transition-colors duration-200 shadow-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="font-heading font-bold text-lg text-gray-900 mb-2">{podcast.title}</div>
                  {podcast.subtitle && (
                    <div className="font-body text-gray-600 mb-2">{podcast.subtitle}</div>
                  )}
                  <div className="font-body text-gray-700 mb-3">{podcast.description}</div>
                  {(podcast.image || podcast.coverImage || "/8eh-real.svg") && (
                    <img 
                      src={podcast.image || podcast.coverImage || "/8eh-real.svg"} 
                      alt="cover" 
                      className="w-32 h-32 object-cover rounded-md border border-gray-200 shadow-sm mb-3" 
                    />
                  )}
                  <audio 
                    controls 
                    src={podcast.audioUrl ? `/api/proxy-audio?url=${encodeURIComponent(podcast.audioUrl)}` : undefined} 
                    className="w-full rounded-md" 
                  />
                  <div className="font-body text-xs text-gray-500 mt-2">By {podcast.author?.name || "Unknown"}</div>
                  {isAdmin && (
                    <div className="flex gap-2 mt-3">
                      <button 
                        onClick={() => handleEdit(podcast)} 
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md font-body font-semibold transition-colors duration-200 shadow-sm"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(podcast.id)} 
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-body font-semibold transition-colors duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed" 
                        disabled={submitting}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default PodcastDashboard; 
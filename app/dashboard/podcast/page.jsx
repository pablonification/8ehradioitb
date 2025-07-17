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
      <h1 className="text-2xl font-bold mb-4">Podcast Dashboard</h1>
      {isAdmin && (
        <form onSubmit={handleSubmit} className="mb-8 space-y-4 bg-white p-4 rounded shadow">
          <div>
            <label className="block font-semibold">Title</label>
            <input name="title" value={form.title} onChange={handleChange} className="w-full border p-2 rounded" required />
          </div>
          <div>
            <label className="block font-semibold">Subtitle (optional)</label>
            <input name="subtitle" value={form.subtitle} onChange={handleChange} className="w-full border p-2 rounded" />
          </div>
          <div>
            <label className="block font-semibold">Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} className="w-full border p-2 rounded" required />
          </div>
          <div>
            <label className="block font-semibold">Date (e.g. Dec 7, 2024)</label>
            <input name="date" value={form.date} onChange={handleChange} className="w-full border p-2 rounded" />
          </div>
          <div>
            <label className="block font-semibold">Duration (e.g. 33 min 40 sec)</label>
            <input name="duration" value={form.duration} onChange={handleChange} className="w-full border p-2 rounded" />
          </div>
          <div>
            <label className="block font-semibold">Image URL (optional, overrides cover image)</label>
            <input name="image" value={form.image} onChange={handleChange} className="w-full border p-2 rounded" />
          </div>
          <div>
            <label className="block font-semibold">Audio File</label>
            <input name="audio" type="file" accept="audio/*" onChange={handleChange} className="w-full" required />
          </div>
          <div>
            <label className="block font-semibold">Cover Image (optional)</label>
            <input name="coverImage" type="file" accept="image/*" onChange={handleChange} className="w-full" />
          </div>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded" disabled={submitting}>{submitting ? "Adding..." : "Add Podcast"}</button>
          {error && <div className="text-red-600 mt-2">{error}</div>}
        </form>
      )}
      <h2 className="text-xl font-semibold mb-2">All Podcasts</h2>
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <ul className="space-y-4">
          {podcasts.map((podcast) => (
            <li key={podcast.id} className="border p-4 rounded bg-gray-50">
              {editId === podcast.id ? (
                <div className="space-y-2">
                  <input name="title" value={editForm.title} onChange={handleEditChange} className="w-full border p-2 rounded" />
                  <input name="subtitle" value={editForm.subtitle} onChange={handleEditChange} className="w-full border p-2 rounded" />
                  <textarea name="description" value={editForm.description} onChange={handleEditChange} className="w-full border p-2 rounded" />
                  <input name="date" value={editForm.date} onChange={handleEditChange} className="w-full border p-2 rounded" />
                  <input name="duration" value={editForm.duration} onChange={handleEditChange} className="w-full border p-2 rounded" />
                  <input name="image" value={editForm.image} onChange={handleEditChange} className="w-full border p-2 rounded" />
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => handleEditSave(podcast.id)} className="bg-green-600 text-white px-3 py-1 rounded" disabled={submitting}>Save</button>
                    <button onClick={() => setEditId(null)} className="bg-gray-400 text-white px-3 py-1 rounded">Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="font-bold text-lg">{podcast.title}</div>
                  <div className="text-gray-700 mb-2">{podcast.description}</div>
                  {(podcast.image || podcast.coverImage || "/8eh-real.svg") && (
                    <img src={podcast.image || podcast.coverImage || "/8eh-real.svg"} alt="cover" className="w-32 h-32 object-cover rounded mb-2" />
                  )}
                  <audio controls src={podcast.audioUrl ? `/api/proxy-audio?url=${encodeURIComponent(podcast.audioUrl)}` : undefined} className="w-full" />
                  <div className="text-xs text-gray-500 mt-1">By {podcast.author?.name || "Unknown"}</div>
                  {isAdmin && (
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => handleEdit(podcast)} className="bg-yellow-500 text-white px-3 py-1 rounded">Edit</button>
                      <button onClick={() => handleDelete(podcast.id)} className="bg-red-600 text-white px-3 py-1 rounded" disabled={submitting}>Delete</button>
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
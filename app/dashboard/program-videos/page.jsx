'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import useSWR from 'swr';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

const fetcher = url => fetch(url, {
  cache: 'no-store',
  headers: {
    'Cache-Control': 'no-cache'
  }
}).then(r => r.json());

export default function ProgramVideosPage() {
  const { data: videos, mutate, isLoading } = useSWR('/api/program-videos', fetcher);
  const [form, setForm] = useState({ title: '', link: '', thumbnail: null });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field) => (e) => {
      if (e.target.files) {
          setForm({ ...form, [field]: e.target.files[0] });
      } else {
        setForm({ ...form, [field]: e.target.value });
      }
  }

  const save = async () => {
    setError('');
    if (!form.title || !form.link || !form.thumbnail) {
      setError('All fields are required');
      return;
    }
    setSaving(true);

    const formData = new FormData();
    formData.append('title', form.title);
    formData.append('link', form.link);
    formData.append('thumbnail', form.thumbnail);

    const res = await fetch('/api/program-videos', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      setError('Failed to save');
    } else {
      setForm({ title: '', link: '', thumbnail: null });
      mutate();
    }
    setSaving(false);
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this video?")) return;
    await fetch('/api/program-videos', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    mutate();
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-heading font-bold mb-6 text-gray-900">Manage Program Videos</h1>

      {/* Add form */}
      <div className="mb-8 space-y-6 bg-white p-6 sm:p-8 rounded-xl shadow-md border border-gray-200">
        <h2 className="text-xl font-heading font-semibold mb-6 text-gray-800">Add New Video</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className="block font-semibold font-body text-gray-800 mb-2">Title</label>
                <input
                    className="w-full border border-gray-300 p-3 rounded-lg font-body text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Title"
                    value={form.title}
                    onChange={handleChange('title')}
                />
            </div>
            <div>
                <label className="block font-semibold font-body text-gray-800 mb-2">YouTube Link</label>
                <input
                    className="w-full border border-gray-300 p-3 rounded-lg font-body text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="YouTube link"
                    value={form.link}
                    onChange={handleChange('link')}
                />
            </div>
            <div className="md:col-span-2">
                <label className="block font-semibold font-body text-gray-800 mb-2">Thumbnail</label>
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleChange('thumbnail')}
                    className="w-full border border-gray-300 p-3 rounded-lg font-body text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors file:mr-2 file:py-2 file:px-3 file:rounded-md file:border-0 file:bg-gray-100 hover:file:bg-gray-200"
                />
            </div>
        </div>

        {error && <div className="text-red-700 mt-2 font-body bg-red-50 border border-red-200 p-3 rounded-lg">{error}</div>}
        <button
          onClick={save}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-body font-semibold transition-colors duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          disabled={saving}
        >
          <FiPlus size={18} />
          {saving ? 'Saving…' : 'Add Video'}
        </button>
      </div>

      {/* List */}
      <div className="bg-white p-6 sm:p-8 rounded-xl shadow-md border border-gray-200">
        <h2 className="text-xl font-heading font-semibold mb-6 text-gray-900">All Videos</h2>
        {isLoading ? (
          <div className="text-center font-body text-gray-700 py-8">Loading...</div>
        ) : (
          <ul className="space-y-6">
            {videos && videos.length > 0 ? (
              videos.map((v) => (
                <li key={v.id} className="border border-gray-200 p-6 rounded-lg bg-gray-50 hover:shadow-md transition-shadow flex items-center space-x-4">
                  <img src={v.thumbnail} className="w-32 h-20 object-cover rounded" alt={v.title} />
                  <div className="flex-1">
                    <p className="font-semibold font-body text-gray-800">{v.title}</p>
                    <a href={v.link} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline font-body">
                      Watch on YouTube
                    </a>
                  </div>
                  <button onClick={() => remove(v.id)} className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-100 transition-colors">
                    <FiTrash2 size={18}/>
                  </button>
                </li>
              ))
            ) : (
                <div className="text-center font-body text-gray-700 py-8">No videos yet.</div>
            )}
          </ul>
        )}
      </div>
    </div>
  );
} 
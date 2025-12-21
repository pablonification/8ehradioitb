"use client";

import { useState, useEffect, useMemo } from "react";

export default function TrainingStudio() {
  const [activeTab, setActiveTab] = useState(1);

  const tabs = [
    { id: 1, label: "Blog Engagement Training", implemented: true },
    { id: 2, label: "New Blog Prediction", implemented: true },
    { id: 3, label: "Podcast Similarity", implemented: true },
    { id: 4, label: "Social Captions", implemented: true },
    { id: 5, label: "Chart Summarizer", implemented: true },
  ];

  const TabIcon = ({ id }) => {
    const common = "w-4 h-4 text-gray-500";
    switch (id) {
      case 1:
        return (
          <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19V8" />
            <path d="M10 19V5" />
            <path d="M16 19v-7" />
            <path d="M4 19h16" />
          </svg>
        );
      case 2:
        return (
          <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3 13.5 7.5 18 9 13.5 10.5 12 15 10.5 10.5 6 9 10.5 7.5 12 3Z" />
            <path d="M5 20h14" />
          </svg>
        );
      case 3:
        return (
          <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3a4 4 0 0 1 4 4v4a4 4 0 0 1-8 0V7a4 4 0 0 1 4-4Z" />
            <path d="M8 13v2a4 4 0 0 0 8 0v-2" />
            <path d="M10 21h4" />
          </svg>
        );
      case 4:
        return (
          <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 8a7 7 0 0 1 7-7 7 7 0 0 1 7 7c0 3.866-3.134 7-7 7l-3 3v-3c-2.761 0-4-1.79-4-4Z" />
          </svg>
        );
      case 5:
        return (
          <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3v6l5 4" />
            <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col md:flex-row min-h-[600px]">
      <div className="w-full md:w-64 bg-gray-50 border-r border-gray-200 flex-shrink-0">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-heading font-bold text-gray-900">
            Integration Scenarios
          </h2>
          <p className="text-xs text-gray-800 mt-1">Select a task to perform</p>
        </div>
        <nav className="p-2 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full text-left px-3 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-3 ${
                activeTab === tab.id
                  ? "bg-white text-red-600 shadow-sm border border-gray-200"
                  : "text-gray-900 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <TabIcon id={tab.id} />
              <span className="flex-1">{tab.label}</span>
              {!tab.implemented && (
                <span className="text-[10px] bg-gray-200 text-gray-900 px-1.5 py-0.5 rounded uppercase tracking-wider">
                  Soon
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex-1 p-6 md:p-8 overflow-y-auto">
        {activeTab === 1 && <BlogTrainingScenario />}
        {activeTab === 2 && <BlogPredictionScenario />}
        {activeTab === 3 && <PodcastSimilarityScenario />}
        {activeTab === 4 && <SocialCaptionScenario />}
        {activeTab === 5 && <ChartSummarizerScenario />}
      </div>
    </div>
  );
}

function BlogTrainingScenario() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [trainingStatus, setTrainingStatus] = useState(null);
  const [modelId, setModelId] = useState("blog-engagement-v1");
  const [visibleCount, setVisibleCount] = useState(5);
  const [modelStatus, setModelStatus] = useState(null);
  const [modelStatusLoading, setModelStatusLoading] = useState(false);
  const [lastModelId, setLastModelId] = useState("blog-engagement-v1");
  const [featurePreview, setFeaturePreview] = useState(null);
  const [insights, setInsights] = useState(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [modelsList, setModelsList] = useState([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [deletingModelId, setDeletingModelId] = useState(null);

  // Used to scale the simple bar visualization for numeric features
  const featureScaleMax = useMemo(() => {
    if (!featurePreview) return 0;
    const numericValues = Object.values(featurePreview).filter(
      (val) => typeof val === "number"
    );
    if (numericValues.length === 0) return 0;
    return Math.max(...numericValues, 0);
  }, [featurePreview]);

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/blog");
      if (!res.ok) throw new Error("Failed to fetch blogs");
      const data = await res.json();

      const blogList = Array.isArray(data) ? data : data.blogs || [];
      setBlogs(blogList);
      setVisibleCount(5);
      setTrainingStatus(null);
    } catch (err) {
      console.error(err);
      alert("Error fetching blogs: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const startTraining = async () => {
    if (blogs.length === 0) return;
    setLoading(true);
    setTrainingStatus(null);
    setInsights(null);

    try {
      const training_data = blogs.map((b) => ({
        title_length: b.title?.length || 0,
        content_length: b.content?.length || 0,
        has_image: b.mainImage ? 1 : 0,
        tag_count: b.tags?.length || 0,
        category: b.category || "uncategorized",
        read_count: b.readCount || 0,
      }));

      // Keep a snapshot of the first row so we can show feature/value pairs in the UI
      setFeaturePreview(training_data[0] || null);

      const res = await fetch("/api/ml/training", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: modelId,
          target_col: "read_count",
          training_data,
        }),
      });

      let payload = {};
      try {
        payload = await res.json();
      } catch (e) {
        payload = {};
      }

      if (res.status === 202) {
        setTrainingStatus({
          kind: "queued",
          message: payload.message || "Training queued",
          id: payload.id || modelId,
        });
        setLastModelId(payload.id || modelId);
      } else if (res.status === 409) {
        setTrainingStatus({
          kind: "error",
          code: 409,
          message: payload.message || "Model ID already exists",
          detail: payload.detail || payload.error,
        });
        setLastModelId(modelId);
      } else if (res.status === 422) {
        setTrainingStatus({
          kind: "validation",
          code: 422,
          message: "Validation error",
          detail: payload.detail || [],
        });
        setLastModelId(modelId);
      } else if (!res.ok) {
        setTrainingStatus({
          kind: "error",
          code: res.status,
          message: payload.message || "Training failed",
          detail: payload,
        });
        setLastModelId(modelId);
      } else {
        setTrainingStatus({ kind: "info", ...payload });
        setLastModelId(payload.id || modelId);
      }
    } catch (err) {
      console.error(err);
      setTrainingStatus({ kind: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const fetchModelStatus = async () => {
    if (!lastModelId) return;
    setModelStatusLoading(true);
    try {
      const res = await fetch(`/api/ml/models/${lastModelId}`);
      let payload = {};
      try {
        payload = await res.json();
      } catch (e) {
        payload = {};
      }

      if (res.ok) {
        setModelStatus({ kind: "status", code: res.status, data: payload });
      } else {
        setModelStatus({
          kind: "error",
          code: res.status,
          message: payload.message || "Cannot fetch model status",
          detail: payload.detail || payload.error,
        });
      }
    } catch (err) {
      setModelStatus({ kind: "error", message: err.message });
    } finally {
      setModelStatusLoading(false);
    }
  };

  const deleteModel = async (id) => {
    if (!id) return;
    setDeletingModelId(id);
    try {
      const res = await fetch(`/api/ml/models/${id}`, { method: "DELETE" });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload.message || payload.error || "Failed to delete model");
      }
      setModelsList((prev) => prev.filter((m) => m.id !== id));
      if (lastModelId === id) {
        setLastModelId("");
        setModelStatus(null);
      }
    } catch (e) {
      alert(`Delete failed: ${e.message}`);
    } finally {
      setDeletingModelId(null);
    }
  };

  // Auto-check model status shortly after a training request is accepted
  useEffect(() => {
    if (trainingStatus?.kind === "queued" && lastModelId) {
      const timer = setTimeout(() => {
        fetchModelStatus();
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [trainingStatus, lastModelId]);

  useEffect(() => {
    async function fetchModels() {
      setModelsLoading(true);
      try {
        const res = await fetch("/api/ml/models");
        if (!res.ok) return;
        const payload = await res.json();
        if (payload?.models) setModelsList(payload.models);
      } catch (e) {
        console.error("Failed to fetch models list", e);
      } finally {
        setModelsLoading(false);
      }
    }
    fetchModels();
  }, []);

  const buildInsightPayload = () => {
    if (blogs.length === 0) return null;

    const count = blogs.length;
    const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

    const readCounts = blogs.map((b) => b.readCount || 0);
    const titleLengths = blogs.map((b) => (b.title?.length ? b.title.length : 0));
    const contentLengths = blogs.map((b) => (b.content?.length ? b.content.length : 0));
    const tagCounts = blogs.map((b) => (b.tags?.length ? b.tags.length : 0));
    const hasImageCounts = blogs.map((b) => (b.mainImage ? 1 : 0));

    const categoryCounts = blogs.reduce((acc, b) => {
      const c = b.category || "uncategorized";
      acc[c] = (acc[c] || 0) + 1;
      return acc;
    }, {});

    const topCategories = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat, freq]) => `${cat} (${freq})`);

    const summary = {
      total_rows: count,
      avg_read_count: Number(avg(readCounts).toFixed(2)),
      max_read_count: Math.max(...readCounts, 0),
      min_read_count: Math.min(...readCounts, 0),
      avg_title_length: Number(avg(titleLengths).toFixed(2)),
      avg_content_length: Number(avg(contentLengths).toFixed(2)),
      avg_tag_count: Number(avg(tagCounts).toFixed(2)),
      pct_with_image: Number(((avg(hasImageCounts)) * 100).toFixed(1)),
      top_categories: topCategories,
    };

    const samples = blogs.slice(0, 5).map((b) => ({
      title: b.title,
      category: b.category,
      tags: b.tags?.slice(0, 5) || [],
      has_image: Boolean(b.mainImage),
      title_length: b.title?.length || 0,
      content_length: b.content?.length || 0,
      tag_count: b.tags?.length || 0,
      read_count: b.readCount || 0,
    }));

    return { summary, samples };
  };

  const formatInsights = (text) => {
    if (!text) return [];
    return text
      .split("\n")
      .map((line) => line.trim())
      // strip any leading bullet/dash/asterisk and whitespace
      .map((line) => line.replace(/^[\s\-*•]+/, "").trim())
      // drop empties and standalone markers
      .filter((line) => line && line !== "•" && line !== "*" && line !== "-")
      // drop generic intro lines
      .filter((line) => !/^berikut adalah insight/i.test(line))
      // aggressively remove all asterisk markers to avoid malformed bold
      .map((line) => line.replace(/\*/g, ""))
      // remove inline math markers and latex-style approx
      .map((line) => line.replace(/\$/g, "").replace(/\\approx/g, "approx"))
      // remove stray backslashes before underscores
      .map((line) => line.replace(/\\_/g, "_"))
      // strip leading punctuation like colons
      .map((line) => line.replace(/^:+/, ""))
      .map((line) => line.trim())
      .filter(Boolean);
  };

  const generateInsights = async () => {
    const payload = buildInsightPayload();
    if (!payload) return;
    setInsightLoading(true);
    setInsights(null);
    try {
      const res = await fetch("/api/ml/insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        const detail = data.detail ? ` (${data.detail})` : "";
        throw new Error(data.error || data.message || "Failed to generate insights" + detail);
      }
      setInsights(data.insights || data.text || "");
    } catch (err) {
      setInsights(`Gagal membuat insight: ${err.message}`);
    } finally {
      setInsightLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-2xl font-heading font-bold text-gray-900">
          Blog Engagement Training
        </h3>
        <p className="text-gray-900 mt-1">
          Train a model to predict `readCount` based on blog features like title
          length, content length, and tags.
        </p>
      </div>

      {/* 1. List Models */}
      <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-bold text-gray-900 flex items-center gap-2">
            <span className="bg-red-100 text-red-600 w-6 h-6 rounded-full flex items-center justify-center text-sm">
              1
            </span>
            List Models
          </h4>
          <span className="text-xs text-gray-600">Latest trained models (read-only)</span>
        </div>

        {modelsLoading ? (
          <div className="text-sm text-gray-700">Loading models...</div>
        ) : modelsList.length === 0 ? (
          <div className="text-sm text-gray-700">No models found yet. Train a model to see it here.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {modelsList.slice(0, 6).map((m) => (
              <div key={m.id} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-900 truncate">{m.id}</span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full uppercase tracking-wide font-semibold ${
                        m.status === "ready"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          : m.status === "training" || m.status === "queued"
                            ? "bg-blue-100 text-blue-800 border border-blue-200"
                            : "bg-gray-100 text-gray-700 border border-gray-200"
                      }`}
                    >
                      {m.status || "unknown"}
                    </span>
                    <button
                      onClick={() => deleteModel(m.id)}
                      disabled={deletingModelId === m.id}
                      className="text-[11px] px-2 py-0.5 rounded border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 disabled:opacity-50"
                    >
                      {deletingModelId === m.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 text-[11px] text-gray-700">
                  {m.model_type && (
                    <span className="px-2 py-0.5 rounded bg-gray-100 border border-gray-200">{m.model_type}</span>
                  )}
                  {m.target_col && (
                    <span className="px-2 py-0.5 rounded bg-gray-100 border border-gray-200">target: {m.target_col}</span>
                  )}
                  {Array.isArray(m.feature_cols) && m.feature_cols.length > 0 && (
                    <span className="px-2 py-0.5 rounded bg-gray-100 border border-gray-200">
                      features: {m.feature_cols.slice(0, 3).join(", ")}{m.feature_cols.length > 3 ? "…" : ""}
                    </span>
                  )}
                  {m.updated_at && (
                    <span className="px-2 py-0.5 rounded bg-gray-100 border border-gray-200">updated: {m.updated_at}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Load Training Data */}
      <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-bold text-gray-900 flex items-center gap-2">
            <span className="bg-red-100 text-red-600 w-6 h-6 rounded-full flex items-center justify-center text-sm">
              2
            </span>
            Load Training Data
          </h4>
          <button
            onClick={fetchBlogs}
            disabled={loading}
            className="bg-white border border-gray-300 text-gray-900 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {loading && blogs.length === 0 ? "Fetching..." : "Fetch Blog Data"}
          </button>
        </div>

        {blogs.length > 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="overflow-x-auto max-h-80">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-900 uppercase bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3 text-center">Tags</th>
                    <th className="px-4 py-3 text-right text-red-600 font-bold">
                      Read Count (Target)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {blogs.slice(0, visibleCount).map((blog, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900 truncate max-w-[200px]">
                        {blog.title}
                      </td>
                      <td className="px-4 py-3 text-gray-900">
                        {blog.category}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-900">
                        {blog.tags?.length || 0}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-gray-900">
                        {blog.readCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {blogs.length > visibleCount ? (
              <button
                onClick={() => setVisibleCount((prev) => prev + 5)}
                className="w-full px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 font-medium border-t border-gray-200 transition-colors"
              >
                Load More ({blogs.length - visibleCount} remaining)
              </button>
            ) : blogs.length > 5 ? (
              <div className="px-4 py-2 text-xs text-center text-green-600 bg-green-50 border-t border-gray-200">
                ✓ All {blogs.length} rows loaded
              </div>
            ) : null}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-800 text-sm bg-white rounded-lg border border-dashed border-gray-300">
            Click "Fetch Blog Data" to load data from 8EH API
          </div>
        )}
      </div>

      <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
        <h4 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
          <span className="bg-red-100 text-red-600 w-6 h-6 rounded-full flex items-center justify-center text-sm">
            3
          </span>
          Train Model
        </h4>

        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-xs font-medium text-gray-900 mb-1">
              Model ID
            </label>
            <input
              type="text"
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
              placeholder="e.g., blog-engagement-v1"
            />
          </div>
          <button
            onClick={startTraining}
            disabled={loading || blogs.length === 0}
            className="w-full md:w-auto bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && blogs.length > 0 ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Training...
              </>
            ) : (
              "Start Training"
            )}
          </button>
        </div>

        {/* REPLACEMENT FOR THE OUTPUT SECTION */}
        {trainingStatus && (
          <div className="mt-6 animate-fade-in-up">
            {/* Header Status Bar */}
            <div
              className={`rounded-t-xl border-t border-x px-5 py-4 flex items-center justify-between ${
                trainingStatus.kind === "error" ||
                trainingStatus.kind === "validation"
                  ? "bg-rose-50 border-rose-200"
                  : trainingStatus.kind === "queued"
                  ? "bg-blue-50 border-blue-200"
                  : "bg-emerald-50 border-emerald-200"
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Status Icons */}
                <div
                  className={`p-2 rounded-full ${
                    trainingStatus.kind === "error" ||
                    trainingStatus.kind === "validation"
                      ? "bg-white text-rose-600 shadow-sm"
                      : trainingStatus.kind === "queued"
                      ? "bg-white text-blue-600 shadow-sm animate-pulse"
                      : "bg-white text-emerald-600 shadow-sm"
                  }`}
                >
                  {trainingStatus.kind === "queued" ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  ) : trainingStatus.kind === "error" ||
                    trainingStatus.kind === "validation" ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  )}
                </div>
                <div>
                  <h5
                    className={`font-bold text-sm ${
                      trainingStatus.kind === "error" ||
                      trainingStatus.kind === "validation"
                        ? "text-rose-900"
                        : trainingStatus.kind === "queued"
                        ? "text-blue-900"
                        : "text-emerald-900"
                    }`}
                  >
                    {trainingStatus.kind === "queued"
                      ? "Training In Progress"
                      : trainingStatus.kind === "error"
                      ? "Training Failed"
                      : trainingStatus.kind === "validation"
                      ? "Validation Error"
                      : "Training Successful"}
                  </h5>
                  <p
                    className={`text-xs ${
                      trainingStatus.kind === "error" ||
                      trainingStatus.kind === "validation"
                        ? "text-rose-700"
                        : trainingStatus.kind === "queued"
                        ? "text-blue-700"
                        : "text-emerald-700"
                    }`}
                  >
                    {trainingStatus.message}
                  </p>
                </div>
              </div>

              {/* Status Tags */}
              <div className="flex flex-col items-end gap-1">
                {trainingStatus.code && (
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-white/60 border border-black/5 text-gray-600">
                    HTTP {trainingStatus.code}
                  </span>
                )}
                {(trainingStatus.id || modelId) && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/60 border border-black/5 text-gray-600 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                    {trainingStatus.id || modelId}
                  </span>
                )}
              </div>
            </div>

            {/* Content Body */}
            <div className="bg-white border-x border-b border-gray-200 rounded-b-xl p-5 shadow-sm">
              {/* QUEUED STATE Content */}
              {trainingStatus.kind === "queued" && (
                <div className="flex flex-col gap-4 py-6">
                  <div className="bg-white border border-blue-100 rounded-lg p-4 shadow-sm text-gray-900 flex items-start gap-3">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 border border-blue-200 font-semibold text-sm">✓</span>
                    <div>
                      <div className="text-sm font-semibold text-blue-900">Training accepted</div>
                      <p className="text-sm text-gray-700 mt-1 leading-relaxed">Job queued. We will check status automatically.</p>
                      <p className="text-xs text-gray-600 mt-2">
                        Model ID: <span className="font-mono text-blue-800">{trainingStatus.id || modelId}</span>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* SUCCESS / INFO STATE Content */}
              {trainingStatus.kind === "info" && (
                <div className="space-y-4">
                  {trainingStatus.detail &&
                  typeof trainingStatus.detail === "object" &&
                  !Array.isArray(trainingStatus.detail) ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {Object.entries(trainingStatus.detail).map(([k, v]) => (
                        <div
                          key={k}
                          className="bg-gray-50 border border-gray-100 rounded-lg p-3 hover:border-emerald-200 transition-colors group"
                        >
                          <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1 group-hover:text-emerald-600">
                            {k.replace(/_/g, " ")}
                          </div>
                          <div className="text-lg font-mono font-bold text-gray-900 truncate">
                            {typeof v === "number" ? v.toFixed(4) : String(v)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700">
                      {trainingStatus.detail ? String(trainingStatus.detail) : "Model is ready to use for predictions."}
                    </div>
                  )}
                  <div className="flex justify-end">
                    <button className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1">
                      Go to Predictions &rarr;
                    </button>
                  </div>
                </div>
              )}

              {/* ERROR STATE Content */}
              {trainingStatus.kind === "error" && (
                <div className="space-y-3">
                  <div className="text-sm text-gray-700">
                    Terjadi kesalahan saat proses training. Berikut detail teknisnya:
                  </div>
                  {trainingStatus.detail && typeof trainingStatus.detail === "string" && (
                    <div className="bg-white border border-rose-100 rounded-lg p-3 text-sm text-rose-800 shadow-sm">
                      {trainingStatus.detail}
                    </div>
                  )}

                  {trainingStatus.detail &&
                  typeof trainingStatus.detail === "object" &&
                  !Array.isArray(trainingStatus.detail) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {Object.entries(trainingStatus.detail).map(([k, v]) => (
                        <div
                          key={k}
                          className="bg-white border border-rose-100 rounded-lg p-3 text-xs text-rose-900 shadow-sm"
                        >
                          <div className="text-[11px] uppercase tracking-wide text-rose-700 font-semibold">
                            {k.replace(/_/g, " ")}
                          </div>
                          <div className="mt-1 text-sm font-medium text-rose-900">
                            {typeof v === "number" ? v.toFixed(3) : String(v)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* VALIDATION ERROR Content */}
              {trainingStatus.kind === "validation" && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 mb-2">
                    Data yang dikirim tidak sesuai format:
                  </p>
                  <div className="divide-y divide-gray-100 border border-gray-100 rounded-lg">
                    {(trainingStatus.detail || []).map((d, idx) => (
                      <div key={idx} className="p-3 text-sm flex gap-3 items-start bg-white first:rounded-t-lg last:rounded-b-lg hover:bg-gray-50">
                        <span className="flex-shrink-0 mt-0.5 text-xs font-mono bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded border border-rose-200">
                          {Array.isArray(d.loc)
                            ? d.loc[d.loc.length - 1]
                            : "Field"}
                        </span>
                        <span className="text-gray-700">
                          {d.msg || JSON.stringify(d)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Model Status Viewer */}
        <div className="mt-6 bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <h5 className="text-sm font-bold text-gray-900">Model Status</h5>
              {lastModelId && (
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-gray-100 border border-gray-200 text-gray-700">
                  {lastModelId}
                </span>
              )}
            </div>
            <div className="text-[11px] text-gray-600">
              Auto-updates after training is accepted
            </div>
          </div>

          {modelStatusLoading && (
            <p className="text-sm text-gray-700">Checking model status...</p>
          )}

          {!modelStatusLoading && !modelStatus && (
            <p className="text-sm text-gray-600">
              Run training to see the latest model status automatically.
            </p>
          )}

          {!modelStatusLoading && modelStatus?.kind === "status" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide ${
                    modelStatus.data?.status === "ready"
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      : modelStatus.data?.status === "queued" || modelStatus.data?.status === "training"
                        ? "bg-blue-100 text-blue-800 border border-blue-200"
                        : modelStatus.data?.status === "failed"
                          ? "bg-rose-100 text-rose-800 border border-rose-200"
                          : "bg-gray-100 text-gray-800 border border-gray-200"
                  }`}
                >
                  {modelStatus.data?.status || "unknown"}
                </span>
                {modelStatus.data?.updated_at && (
                  <span className="text-[11px] px-2 py-0.5 rounded bg-gray-100 border border-gray-200 text-gray-700">
                    Updated: {modelStatus.data.updated_at}
                  </span>
                )}
                {modelStatus.data?.model_type && (
                  <span className="text-[11px] px-2 py-0.5 rounded bg-gray-100 border border-gray-200 text-gray-700">
                    Type: {modelStatus.data.model_type}
                  </span>
                )}
                {modelStatus.data?.target_col && (
                  <span className="text-[11px] px-2 py-0.5 rounded bg-gray-100 border border-gray-200 text-gray-700">
                    Target: {modelStatus.data.target_col}
                  </span>
                )}
              </div>

              {Array.isArray(modelStatus.data?.feature_cols) && modelStatus.data.feature_cols.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-700">Features</p>
                  <div className="flex flex-wrap gap-2">
                    {modelStatus.data.feature_cols.slice(0, 12).map((f) => (
                      <span
                        key={f}
                        className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 border border-gray-200 text-gray-800"
                      >
                        {f}
                      </span>
                    ))}
                    {modelStatus.data.feature_cols.length > 12 && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-50 border border-dashed border-gray-200 text-gray-600">
                        +{modelStatus.data.feature_cols.length - 12} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {!modelStatus.data?.feature_cols && (
                <p className="text-sm text-gray-700">No feature metadata available yet.</p>
              )}

              {featurePreview && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-700">Feature Values (sample row)</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {Object.entries(featurePreview).map(([key, value]) => (
                      <div
                        key={key}
                        className="border border-gray-100 bg-gray-50 rounded-lg p-3 flex flex-col gap-1"
                      >
                        <span className="text-[10px] uppercase tracking-wide text-gray-500 font-semibold">
                          {key.replace(/_/g, " ")}
                        </span>
                        <span className="text-sm font-mono text-gray-900">
                          {key === "has_image"
                            ? value
                              ? "Yes"
                              : "No"
                            : typeof value === "number"
                              ? value.toFixed(2)
                              : String(value)}
                        </span>

                        {typeof value === "number" && featureScaleMax > 0 && (
                          <div className="mt-1 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-red-400 to-red-600"
                              style={{ width: `${Math.min((value / featureScaleMax) * 100, 100)}%` }}
                            ></div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {!modelStatusLoading && modelStatus?.kind === "error" && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-rose-800">Could not fetch model status</p>
              <p className="text-sm text-gray-800">{modelStatus.message}</p>
              {modelStatus.detail && (
                <div className="text-xs text-gray-800 bg-white border border-rose-100 rounded-lg p-3">
                  {typeof modelStatus.detail === "string"
                    ? modelStatus.detail
                    : JSON.stringify(modelStatus.detail, null, 2)}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Insights via Gemini */}
        <div className="mt-6 bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h5 className="text-sm font-bold text-gray-900">AI Insights (Gemini)</h5>
              <p className="text-xs text-gray-700">Concise, actionable notes based on the loaded training data.</p>
            </div>
            <button
              onClick={generateInsights}
              disabled={insightLoading || blogs.length === 0}
              className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 disabled:opacity-50"
            >
              {insightLoading ? "Generating..." : "Generate Insights"}
            </button>
          </div>

          {blogs.length === 0 && (
            <p className="text-sm text-gray-700">Load training data first to request insights.</p>
          )}

          {insightLoading && (
            <p className="text-sm text-gray-700">Requesting insights from Gemini...</p>
          )}

          {!insightLoading && insights && (
            <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 text-sm text-gray-900 space-y-2">
              {formatInsights(insights).map((item, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="mt-0.5 text-red-500">•</span>
                  <span>{item}</span>
                </div>
              ))}
              {formatInsights(insights).length === 0 && (
                <div className="text-sm text-gray-800 whitespace-pre-line">{insights}</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BlogPredictionScenario() {
  const [newBlogs, setNewBlogs] = useState([]);
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchModels() {
      try {
        const res = await fetch("/api/ml/models");
        const data = await res.json();
        if (data.models) {
          const readyModels = data.models.filter((m) => m.status === "ready");
          setModels(readyModels);
          if (readyModels.length > 0) setSelectedModel(readyModels[0].id);
        }
      } catch (e) {
        console.error("Failed to fetch models", e);
      }
    }
    fetchModels();
  }, []);

  const fetchNewBlogs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/newblog");
      if (!res.ok) throw new Error("Failed to fetch new blogs");
      const data = await res.json();

      const blogList = Array.isArray(data) ? data : data.blogs || [];
      setNewBlogs(blogList);
      setPredictions(null);
    } catch (err) {
      console.error(err);
      alert("Error fetching new blogs: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const runPrediction = async () => {
    if (!selectedModel || newBlogs.length === 0) return;
    setLoading(true);

    try {
      const input_data = newBlogs.map((b) => ({
        title_length: b.title?.length || 0,
        content_length: b.content?.length || 0,
        has_image: b.mainImage ? 1 : 0,
        tag_count: b.tags?.length || 0,
        category: b.category || "uncategorized",
      }));

      const res = await fetch(`/api/ml/predictions/${selectedModel}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input_data }),
      });

      const result = await res.json();
      setPredictions(result.predictions);
    } catch (err) {
      console.error(err);
      alert("Prediction failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-2xl font-heading font-bold text-gray-900">
          New Blog Engagement Prediction
        </h3>
        <p className="text-gray-900 mt-1">
          Use a trained model to predict engagement scores for unpublished/new
          blog posts.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <h4 className="font-bold text-gray-900 text-sm mb-3 uppercase tracking-wide">
              1. Data Source
            </h4>
            <button
              onClick={fetchNewBlogs}
              disabled={loading}
              className="w-full bg-white border border-gray-300 text-gray-900 hover:bg-gray-50 hover:text-red-600 hover:border-red-200 px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 text-left flex justify-between items-center group"
            >
              <span>Fetch New Blogs</span>
              <span className="text-gray-400 group-hover:text-red-500">↓</span>
            </button>
            <p className="text-xs text-gray-800 mt-2">
              Loads mock blog drafts from <code>/api/newblog</code>
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <h4 className="font-bold text-gray-900 text-sm mb-3 uppercase tracking-wide">
              2. Select Model
            </h4>
            {models.length > 0 ? (
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-red-500 outline-none bg-white"
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.id} ({m.status})
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-xs text-orange-700 bg-orange-50 p-2 rounded border border-orange-100">
                No trained models found. Please train a model in the "Training"
                tab first.
              </div>
            )}
          </div>

          <button
            onClick={runPrediction}
            disabled={loading || newBlogs.length === 0 || !selectedModel}
            className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-xl text-sm font-bold shadow-md shadow-red-200 transition-all disabled:opacity-50 disabled:shadow-none flex justify-center items-center gap-2"
          >
            {loading && newBlogs.length > 0 ? (
              <span className="animate-pulse">Analyzing...</span>
            ) : (
              <>
                <span>🔮</span> Predict Engagement
              </>
            )}
          </button>
        </div>

        <div className="md:col-span-2">
          {newBlogs.length > 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <h4 className="font-bold text-gray-900 text-sm">
                  Blog Drafts & Predictions
                </h4>
                <span className="text-xs bg-gray-200 text-gray-900 px-2 py-0.5 rounded-full">
                  {newBlogs.length} Items
                </span>
              </div>
              <div className="divide-y divide-gray-100">
                {newBlogs.map((blog, idx) => {
                  const score = predictions ? predictions[idx] : null;
                  return (
                    <div
                      key={idx}
                      className="p-4 hover:bg-gray-50 transition-colors flex gap-4 items-start"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-900 bg-gray-100 px-1.5 rounded">
                            {blog.category || "General"}
                          </span>
                          <h5
                            className="font-medium text-gray-900 truncate"
                            title={blog.title}
                          >
                            {blog.title}
                          </h5>
                        </div>
                        <p className="text-xs text-gray-900 line-clamp-2">
                          {blog.content}
                        </p>
                        <div className="flex gap-2 mt-2 text-[10px] text-gray-800">
                          <span>Tags: {blog.tags?.length || 0}</span>
                          <span>•</span>
                          <span>
                            Words: {blog.content?.split(" ").length || 0}
                          </span>
                        </div>
                      </div>

                      <div className="flex-shrink-0 flex flex-col items-center justify-center min-w-[80px]">
                        {score !== null ? (
                          <div
                            className={`flex flex-col items-center p-2 rounded-lg border ${
                              score > 1000
                                ? "bg-green-50 border-green-200 text-green-700"
                                : score > 500
                                  ? "bg-blue-50 border-blue-200 text-blue-700"
                                  : "bg-gray-50 border-gray-200 text-gray-900"
                            }`}
                          >
                            <span className="text-xs font-semibold uppercase opacity-70">
                              Predicted
                            </span>
                            <span className="text-xl font-bold font-mono tracking-tight">
                              {Math.round(score)}
                            </span>
                            <span className="text-[10px] opacity-70">
                              Reads
                            </span>
                          </div>
                        ) : (
                          <div className="h-16 w-20 bg-gray-50 rounded-lg border border-dashed border-gray-200 flex items-center justify-center text-gray-700 text-xs">
                            Waiting
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-8 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-800">
              <div className="text-4xl mb-3 opacity-30">📝</div>
              <p className="font-medium">No blog drafts loaded</p>
              <p className="text-sm mt-1">Click "Fetch New Blogs" to start</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PodcastSimilarityScenario() {
  const [podcasts, setPodcasts] = useState([]);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysisResults, setAnalysisResults] = useState([]);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  useEffect(() => {
    fetchPodcasts();
  }, []);

  const fetchPodcasts = async () => {
    try {
      const res = await fetch("/api/podcast");
      if (!res.ok) throw new Error("Failed to fetch podcasts");
      const data = await res.json();
      setPodcasts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const checkSimilarity = async () => {
    if ((!newTitle && !newDescription) || podcasts.length === 0) return;

    setLoading(true);
    setAnalysisResults([]);
    setHasAnalyzed(false);
    setProgress({ current: 0, total: podcasts.length });

    const newContent = `Title: ${newTitle}\n\nDescription: ${newDescription}`;
    const foundSimilar = [];

    for (let i = 0; i < podcasts.length; i++) {
      const p = podcasts[i];
      const existingContent = `Title: ${p.title}\n\nDescription: ${
        p.description || ""
      }`;

      try {
        const res = await fetch("/api/ml/similarity-check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content_1: existingContent,
            content_2: newContent,
          }),
        });
        const result = await res.json();

        if (result.is_similar) {
          foundSimilar.push({
            podcast: p,
            ...result,
          });
        }
      } catch (err) {
        console.error(`Failed to check similarity for ${p.title}`, err);
      }

      setProgress((prev) => ({ ...prev, current: i + 1 }));
    }

    setAnalysisResults(foundSimilar);
    setHasAnalyzed(true);
    setLoading(false);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-2xl font-heading font-bold text-gray-900">
          Podcast Idea Validator
        </h3>
        <p className="text-gray-900 mt-1">
          Enter your new podcast idea to check for similarities against our
          entire episode database.
        </p>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="bg-red-100 text-red-600 w-6 h-6 rounded-full flex items-center justify-center text-sm">
          •
          </span>
          New Podcast Concept
        </h4>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-red-500 outline-none"
              placeholder="Enter the title of your podcast idea..."
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Description & Content
            </label>
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-red-500 outline-none min-h-[120px] resize-y"
              placeholder="Describe the topics, themes, and content of the episode..."
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={checkSimilarity}
              disabled={
                loading ||
                (!newTitle && !newDescription) ||
                podcasts.length === 0
              }
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Checking ({progress.current}/{progress.total})...
                </>
              ) : (
                "Check Similarity"
              )}
            </button>
          </div>
        </div>
      </div>

      {hasAnalyzed && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
          <div className="flex items-center justify-between border-b border-gray-200 pb-2">
            <h4 className="text-lg font-bold text-gray-900">
              Analysis Results
            </h4>
            {analysisResults.length === 0 ? (
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-200">
                Original Idea
              </span>
            ) : (
              <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold border border-red-200">
                {analysisResults.length} Similar Found
              </span>
            )}
          </div>

          {analysisResults.length === 0 ? (
            <div className="bg-green-50 rounded-xl border border-green-200 p-8 text-center">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                ✨
              </div>
              <h5 className="text-lg font-bold text-green-900 mb-2">
                Your Idea is Original!
              </h5>
              <p className="text-green-800 text-sm">
                We checked against {progress.total} existing episodes and found
                no significant similarities. You're good to go!
              </p>
            </div>
          ) : (
            <div className="grid gap-6">
              {analysisResults.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-gray-100 pb-4">
                    <div>
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                        Similar to Existing Episode
                      </span>
                      <h5 className="text-lg font-bold text-gray-900 mt-1">
                        {item.podcast.title}
                      </h5>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-bold border border-red-200 whitespace-nowrap uppercase">
                        {item.similarity_level?.replace("_", " ")}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h6 className="font-semibold text-gray-900 text-xs uppercase mb-2">
                        Originality Assessment
                      </h6>
                      <p className="text-gray-700 text-sm leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100">
                        {item.originality_assessment}
                      </p>
                    </div>

                    <div>
                      <h6 className="font-semibold text-gray-900 text-xs uppercase mb-2">
                        Detailed Analysis
                      </h6>
                      <p className="text-gray-700 text-sm leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100">
                        {item.detailed_analysis}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SocialCaptionScenario() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [platform, setPlatform] = useState("instagram");
  const [captionResult, setCaptionResult] = useState(null);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/program-videos");
      if (!res.ok) throw new Error("Failed to fetch videos");
      const data = await res.json();
      setVideos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      alert("Error fetching videos: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateCaption = async () => {
    if (!selectedVideo) return;
    setLoading(true);
    setCaptionResult(null);

    try {
      const res = await fetch("/api/ml/social-caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform,
          title: selectedVideo.title,
          description: selectedVideo.link || "",
        }),
      });
      const result = await res.json();
      setCaptionResult(result.caption);
    } catch (err) {
      console.error(err);
      alert("Caption generation failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-2xl font-heading font-bold text-gray-900">
          Social Media Caption Generator
        </h3>
        <p className="text-gray-900 mt-1">
          Generate platform-specific captions for video content automatically.
        </p>
      </div>

      <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-bold text-gray-900 flex items-center gap-2">
            <span className="bg-red-100 text-red-600 w-6 h-6 rounded-full flex items-center justify-center text-sm">
              •
            </span>
            Select Video Content
          </h4>
          <button
            onClick={fetchVideos}
            disabled={loading}
            className="bg-white border border-gray-300 text-gray-900 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {loading && videos.length === 0 ? "Loading..." : "Fetch Videos"}
          </button>
        </div>

        {videos.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-h-[300px] overflow-y-auto p-1">
            {videos.map((video) => (
              <div
                key={video.id}
                onClick={() => setSelectedVideo(video)}
                className={`cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                  selectedVideo?.id === video.id
                    ? "border-red-500 ring-2 ring-red-100"
                    : "border-transparent hover:border-gray-300"
                }`}
              >
                <div className="aspect-video bg-gray-200 relative">
                  {video.thumbnail ? (
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-800">
                      <span className="text-2xl">▶</span>
                    </div>
                  )}
                </div>
                <div className="p-2 bg-white">
                  <p className="text-xs font-medium text-gray-900 truncate">
                    {video.title}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-800 bg-white rounded-lg border border-dashed border-gray-300">
            No videos loaded. Click "Fetch Videos" to begin.
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-white p-5 rounded-xl border border-gray-200 shadow-sm h-fit">
          <h4 className="font-bold text-gray-900 text-sm mb-4 uppercase tracking-wide">
            Settings
          </h4>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-900 mb-1">
                Platform
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-red-500 outline-none text-gray-900"
              >
                <option value="instagram">Instagram</option>
                <option value="twitter">Twitter / X</option>
                <option value="tiktok">TikTok</option>
                <option value="linkedin">LinkedIn</option>
              </select>
            </div>
            <button
              onClick={generateCaption}
              disabled={loading || !selectedVideo}
              className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md transition-all disabled:opacity-50 disabled:shadow-none"
            >
              {loading ? "Generating..." : "Generate Caption"}
            </button>
          </div>
        </div>

        <div className="md:col-span-2 bg-white p-5 rounded-xl border border-gray-200 shadow-sm min-h-[200px] flex flex-col">
          <h4 className="font-bold text-gray-900 text-sm mb-2 uppercase tracking-wide border-b border-gray-100 pb-2">
            Generated Caption
          </h4>
          <div className="flex-1 flex items-center justify-center">
            {captionResult ? (
              <div className="w-full h-full">
                <textarea
                  readOnly
                  value={captionResult}
                  className="w-full h-full min-h-[150px] p-3 text-sm text-gray-900 bg-gray-50 rounded-lg border-0 resize-none outline-none font-sans"
                />
                <div className="flex justify-end mt-2">
                  <button
                    onClick={() => navigator.clipboard.writeText(captionResult)}
                    className="text-xs text-red-600 font-medium hover:text-red-700 flex items-center gap-1"
                  >
                    <span>📋</span> Copy to clipboard
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-800 text-sm text-center italic">
                {selectedVideo
                  ? "Ready to generate caption..."
                  : "Select a video first"}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ChartSummarizerScenario() {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [contentString, setContentString] = useState("");
  const [summaryResult, setSummaryResult] = useState(null);

  const fetchChartData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tune-tracker");
      if (!res.ok) throw new Error("Failed to fetch chart data");
      const data = await res.json();
      const charts = Array.isArray(data) ? data : data.data || [];
      setChartData(charts);

      if (charts.length > 0) {
        const sorted = [...charts].sort((a, b) => a.order - b.order);
        const generatedContent =
          "Tune Tracker Chart Summary:\n" +
          sorted
            .map(
              (item) => `Rank ${item.order}: '${item.title}' by ${item.artist}`,
            )
            .join("\n");
        setContentString(generatedContent);
      }
      setSummaryResult(null);
    } catch (err) {
      console.error(err);
      alert("Error fetching chart data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateSummary = async () => {
    if (!contentString) return;
    setLoading(true);
    setSummaryResult(null);

    try {
      const res = await fetch("/api/ml/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: contentString }),
      });
      const result = await res.json();
      setSummaryResult(result.summary);
    } catch (err) {
      console.error(err);
      alert("Summary generation failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-2xl font-heading font-bold text-gray-900">
          Chart Summarizer
        </h3>
        <p className="text-gray-900 mt-1">
          Automatically summarize music chart rankings into announcer-friendly
          scripts.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 flex flex-col h-[500px]">
          <div className="flex justify-between items-center mb-4 flex-shrink-0">
            <h4 className="font-bold text-gray-900 flex items-center gap-2">
              <span className="bg-red-100 text-red-600 w-6 h-6 rounded-full flex items-center justify-center text-sm">
                •
              </span>
              Raw Chart Data
            </h4>
            <button
              onClick={fetchChartData}
              disabled={loading}
              className="bg-white border border-gray-300 text-gray-900 hover:bg-gray-50 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
            >
              Fetch Data
            </button>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex-1 overflow-hidden relative">
            {chartData.length > 0 ? (
              <div className="absolute inset-0 overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className="text-gray-900 uppercase bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-3 py-2 w-12">#</th>
                      <th className="px-3 py-2">Title</th>
                      <th className="px-3 py-2">Artist</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {chartData
                      .sort((a, b) => a.order - b.order)
                      .map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-3 py-2 font-mono font-bold text-red-600">
                            {item.order}
                          </td>
                          <td className="px-3 py-2 font-medium truncate max-w-[120px] text-gray-900">
                            {item.title}
                          </td>
                          <td className="px-3 py-2 text-gray-900 truncate max-w-[100px]">
                            {item.artist}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-800 text-xs">
                No data loaded
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4 h-[500px]">
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex-1 flex flex-col">
            <h4 className="font-bold text-gray-900 text-sm mb-2 uppercase tracking-wide flex-shrink-0">
              Content Context
            </h4>
            <textarea
              value={contentString}
              readOnly
              className="w-full flex-1 border border-gray-200 rounded-lg p-3 text-xs font-mono bg-gray-50 resize-none outline-none mb-3 text-gray-900"
              placeholder="Data will appear here after fetching..."
            />
            <button
              onClick={generateSummary}
              disabled={loading || !contentString}
              className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md transition-all disabled:opacity-50 flex-shrink-0"
            >
              {loading ? "Summarizing..." : "Generate Summary"}
            </button>
          </div>

          <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-5 rounded-xl border border-gray-700 shadow-lg flex-1 overflow-hidden flex flex-col">
            <h4 className="font-bold text-gray-300 text-sm mb-3 uppercase tracking-wide flex-shrink-0 flex items-center gap-2">
              <span>🎙️</span> AI Summary
            </h4>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {summaryResult ? (
                <p className="text-white text-sm leading-relaxed whitespace-pre-line font-medium">
                  {summaryResult}
                </p>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 text-xs italic">
                  Waiting for generation...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

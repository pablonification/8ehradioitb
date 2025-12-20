"use client";

import { useState, useEffect } from "react";

export default function TrainingStudio() {
  const [activeTab, setActiveTab] = useState(1);

  const tabs = [
    { id: 1, label: "Blog Engagement Training", icon: "📈", implemented: true },
    { id: 2, label: "New Blog Prediction", icon: "🔮", implemented: true },
    { id: 3, label: "Podcast Similarity", icon: "🎙️", implemented: true },
    { id: 4, label: "Social Captions", icon: "📱", implemented: true },
    { id: 5, label: "Chart Summarizer", icon: "📊", implemented: true },
  ];

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
              <span className="text-lg">{tab.icon}</span>
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

    try {
      const training_data = blogs.map((b) => ({
        title_length: b.title?.length || 0,
        content_length: b.content?.length || 0,
        has_image: b.mainImage ? 1 : 0,
        tag_count: b.tags?.length || 0,
        category: b.category || "uncategorized",
        read_count: b.readCount || 0,
      }));

      const res = await fetch("/api/ml/training", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: modelId,
          target_col: "read_count",
          training_data,
        }),
      });

      const result = await res.json();
      setTrainingStatus(result);
    } catch (err) {
      console.error(err);
      setTrainingStatus({ status: "error", message: err.message });
    } finally {
      setLoading(false);
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

      <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-bold text-gray-900 flex items-center gap-2">
            <span className="bg-red-100 text-red-600 w-6 h-6 rounded-full flex items-center justify-center text-sm">
              1
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
            2
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

        {trainingStatus && (
          <div
            className={`mt-4 p-4 rounded-lg border ${
              trainingStatus.status === "error"
                ? "bg-red-50 border-red-200 text-red-700"
                : "bg-green-50 border-green-200"
            }`}
          >
            <h5
              className={`font-bold text-sm mb-2 ${
                trainingStatus.status === "error"
                  ? "text-red-800"
                  : "text-green-800"
              }`}
            >
              {trainingStatus.status === "error"
                ? "Training Failed"
                : "Training Completed Successfully"}
            </h5>
            <pre className="text-xs font-mono whitespace-pre-wrap overflow-x-auto text-gray-900 bg-white/50 p-2 rounded">
              {JSON.stringify(trainingStatus, null, 2)}
            </pre>
          </div>
        )}
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

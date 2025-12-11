"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  FiAlertCircle,
  FiDatabase,
  FiEye,
  FiRefreshCw,
  FiTrash2,
  FiZap,
} from "react-icons/fi";

export default function ModelGallery() {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchModels = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ml/models");
      const data = await res.json();

      if (res.ok) {
        setModels(data.models || []);
        setError(null);
      } 
      else {
        const errorMessage = data.message || data.error || "Failed to fetch models";
        setError(errorMessage);
        setModels([]);
      }
    } 
    catch (err) {
      setError("Failed to connect to API");
      setModels([]);
    } 
    finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  const handleDelete = async (modelId) => {
    setError(null);
    try {
      const res = await fetch(`/api/ml/models/${modelId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setDeleteConfirm(null);
        fetchModels();
      } else {
        const data = await res.json();
        let errorMessage = "Failed to delete model";
        
        if (res.status === 404) {
          errorMessage = data.message || data.detail || `Model "${modelId}" not found`;
        } 
        else if (res.status === 422) {
          if (Array.isArray(data.detail) && data.detail.length > 0) {
            errorMessage = data.detail.map((d) => d.msg).join(", ");
          } else {
            errorMessage = data.message || "Validation error";
          }
        } 
        else {
          errorMessage = data.message || data.error || "Failed to delete model";
        }
        
        setError(errorMessage);
        setDeleteConfirm(null);
      }
    } catch (err) {
      setError("Failed to connect to API");
      setDeleteConfirm(null);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "ready":
        return "bg-green-100 text-green-800";
      case "training":
        return "bg-blue-100 text-blue-800";
      case "queued":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatRelativeTime = (dateString) => {
    if (!dateString) return "Unknown";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} mins ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };

  const statusLabel = (status) =>
    status ? status.charAt(0).toUpperCase() + status.slice(1) : "Unknown";

  const renderSkeleton = () => (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {[...Array(3)].map((_, idx) => (
        <div
          key={idx}
          className="animate-pulse rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
        >
          <div className="mb-4 h-4 w-1/2 rounded bg-gray-200" />
          <div className="mb-3 h-3 w-1/3 rounded bg-gray-200" />
          <div className="mb-3 h-3 w-2/3 rounded bg-gray-200" />
          <div className="flex gap-2">
            <div className="h-8 w-20 rounded bg-gray-200" />
            <div className="h-8 w-20 rounded bg-gray-200" />
          </div>
        </div>
      ))}
    </div>
  );

  const EmptyState = () => (
    <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-gray-200">
        <FiDatabase className="text-2xl text-red-600" />
      </div>
      <h3 className="mt-4 text-lg font-heading font-semibold text-gray-800">
        No models yet
      </h3>
      <p className="mt-2 text-sm font-body text-gray-600">
        Train your first model in the Train Model tab to see it listed here.
      </p>
      <div className="mt-4 flex items-center justify-center gap-3">
        <Link
          href="#training"
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-body font-semibold transition-colors"
        >
          Go to Train Model
        </Link>
        <button
          onClick={fetchModels}
          className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 font-body text-gray-800 transition-colors hover:bg-gray-100"
        >
          <FiRefreshCw />
          Refresh
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-heading font-semibold text-gray-800">
            Model Gallery
          </h3>
          <p className="text-sm font-body text-gray-600">
            Browse, refresh, and clean up your trained models.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 font-body text-sm text-gray-700 shadow-sm">
            <FiDatabase className="text-red-600" />
            <span className="font-semibold">{models.length}</span>
            <span>models</span>
          </div>
          <button
            onClick={fetchModels}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 font-body font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
          >
            <FiRefreshCw className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 font-body">
          <FiAlertCircle className="mt-0.5" />
          <div>
            <p className="font-semibold">Something went wrong</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {loading && renderSkeleton()}

      {!loading && models.length === 0 && <EmptyState />}

      {!loading && models.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {models.map((model) => (
            <div
              key={model.id}
              className="relative overflow-hidden rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-xs font-body uppercase tracking-wide text-gray-500">
                    Model ID
                  </div>
                  <div className="text-lg font-heading font-semibold text-gray-900">
                    {model.id}
                  </div>
                  <div className="flex items-center gap-2 text-sm font-body text-gray-600">
                    <FiDatabase className="text-red-600" />
                    <span className="capitalize">{model.model_type}</span>
                  </div>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold font-body ${getStatusBadgeClass(model.status)}`}
                >
                  {statusLabel(model.status)}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 text-sm font-body text-gray-600">
                <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                  <span className="text-gray-500">Updated</span>
                  <span className="font-semibold text-gray-800">
                    {formatRelativeTime(model.updated_at)}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href="#status"
                  className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold font-body text-gray-800 transition hover:bg-gray-100"
                >
                  <FiEye />
                  View Status
                </Link>
                {model.status === "ready" && (
                  <Link
                    href="#predict"
                    className="flex items-center gap-2 rounded-lg bg-gray-800 px-3 py-2 text-sm font-semibold font-body text-white transition hover:bg-gray-900"
                  >
                    <FiZap />
                    Predict
                  </Link>
                )}
                <button
                  onClick={() => setDeleteConfirm(model.id)}
                  className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold font-body text-red-700 transition hover:bg-red-100"
                >
                  <FiTrash2 />
                  Delete
                </button>
              </div>

              {deleteConfirm === model.id && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/95 backdrop-blur-sm">
                  <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-4 shadow-lg">
                    <div className="flex items-start gap-2 text-left">
                      <FiAlertCircle className="mt-0.5 text-red-600" />
                      <div>
                        <p className="font-heading text-base font-semibold text-gray-900">
                          Delete this model?
                        </p>
                        <p className="mt-1 text-sm font-body text-gray-600">
                          {model.id} will be removed permanently. This action
                          cannot be undone.
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end gap-2">
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold font-body text-gray-800 transition hover:bg-gray-100"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleDelete(model.id)}
                        className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold font-body text-white transition hover:bg-red-700"
                      >
                        Confirm Delete
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

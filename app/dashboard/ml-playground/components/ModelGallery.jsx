"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  FiAlertCircle,
  FiCheck,
  FiClock,
  FiDatabase,
  FiEye,
  FiLoader,
  FiRefreshCw,
  FiTrash2,
  FiX,
  FiZap,
} from "react-icons/fi";

export default function ModelGallery({ onNavigateToPredict }) {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  
  // Status modal state
  const [statusModal, setStatusModal] = useState(null); // model id to show status
  const [statusData, setStatusData] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState(null);

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
        let errorMessage = "Gagal memuat daftar model";
        if (typeof data.message === "string") {
          errorMessage = data.message;
        } else if (typeof data.error === "string") {
          errorMessage = data.error;
        }
        setError(errorMessage);
        setModels([]);
      }
    } 
    catch (err) {
      setError("Gagal terhubung ke server. Periksa koneksi internet Anda.");
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
          // API returns { error: "not_found", message: "Model 'xxx' not found" }
          errorMessage = `Model "${modelId}" tidak ditemukan. Mungkin sudah dihapus atau belum selesai training.`;
        } 
        else if (res.status === 422) {
          if (Array.isArray(data.detail) && data.detail.length > 0) {
            errorMessage = data.detail.map((d) => d.msg).join(", ");
          } else {
            errorMessage = data.message || "Terjadi kesalahan validasi";
          }
        } 
        else if (res.status === 401) {
          errorMessage = "Anda tidak memiliki akses untuk menghapus model ini";
        }
        else if (res.status === 503) {
          errorMessage = "Gagal terhubung ke ML API. Silakan coba lagi nanti.";
        }
        else {
          // Extract message properly
          if (typeof data.message === "string") {
            errorMessage = data.message;
          } else if (typeof data.error === "string") {
            errorMessage = data.error;
          } else {
            errorMessage = "Gagal menghapus model. Silakan coba lagi.";
          }
        }
        
        setError(errorMessage);
        setDeleteConfirm(null);
      }
    } catch (err) {
      setError("Gagal terhubung ke server. Periksa koneksi internet Anda.");
      setDeleteConfirm(null);
    }
  };

  const fetchModelStatus = async (modelId) => {
    setStatusModal(modelId);
    setStatusLoading(true);
    setStatusError(null);
    setStatusData(null);

    try {
      const res = await fetch(`/api/ml/models/${modelId}`);
      const data = await res.json();

      if (res.ok) {
        setStatusData(data);
      } else if (res.status === 404) {
        setStatusError(`Model "${modelId}" tidak ditemukan.`);
      } else if (res.status === 422) {
        if (Array.isArray(data.detail) && data.detail.length > 0) {
          setStatusError(data.detail.map((d) => d.msg || String(d)).join(", "));
        } else {
          setStatusError("Terjadi kesalahan validasi");
        }
      } else if (res.status === 401) {
        setStatusError("Anda tidak memiliki akses untuk melihat model ini");
      } else if (res.status === 503) {
        setStatusError("Gagal terhubung ke ML API. Silakan coba lagi nanti.");
      } else {
        let errorMessage = "Gagal memuat status model";
        if (typeof data.message === "string") {
          errorMessage = data.message;
        } else if (typeof data.error === "string") {
          errorMessage = data.error;
        }
        setStatusError(errorMessage);
      }
    } catch (err) {
      setStatusError("Gagal terhubung ke server. Periksa koneksi internet Anda.");
    } finally {
      setStatusLoading(false);
    }
  };

  const closeStatusModal = () => {
    setStatusModal(null);
    setStatusData(null);
    setStatusError(null);
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "ready":
        return <FiCheck className="text-green-600" />;
      case "failed":
        return <FiX className="text-red-600" />;
      case "training":
        return <FiLoader className="text-blue-600 animate-spin" />;
      case "queued":
        return <FiClock className="text-yellow-600" />;
      default:
        return <FiDatabase className="text-gray-600" />;
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
            <p className="font-semibold">Terjadi Kesalahan</p>
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
                <button
                  onClick={() => fetchModelStatus(model.id)}
                  className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold font-body text-gray-800 transition hover:bg-gray-100 cursor-pointer"
                >
                  <FiEye />
                  View Status
                </button>
                {model.status === "ready" && onNavigateToPredict && (
                  <button
                    onClick={() => onNavigateToPredict(model.id)}
                    className="flex items-center gap-2 rounded-lg bg-gray-800 px-3 py-2 text-sm font-semibold font-body text-white transition hover:bg-gray-900 cursor-pointer"
                  >
                    <FiZap />
                    Predict
                  </button>
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

      {/* Status Modal */}
      {statusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md mx-4 rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-heading font-bold text-white">
                  Model Status
                </h3>
                <button
                  onClick={closeStatusModal}
                  className="text-white/80 hover:text-white transition cursor-pointer"
                >
                  <FiX size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {statusLoading && (
                <div className="flex flex-col items-center justify-center py-8">
                  <FiLoader className="text-4xl text-red-600 animate-spin mb-4" />
                  <p className="text-gray-600 font-body">Memuat status...</p>
                </div>
              )}

              {statusError && (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                    <FiX className="text-3xl text-red-600" />
                  </div>
                  <p className="text-red-700 font-body font-semibold mb-2">Terjadi Kesalahan</p>
                  <p className="text-gray-600 font-body text-sm text-center">{statusError}</p>
                </div>
              )}

              {statusData && (
                <div className="space-y-4">
                  {/* Status Card */}
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          statusData.status === "ready" ? "bg-green-100" :
                          statusData.status === "training" ? "bg-blue-100" :
                          statusData.status === "queued" ? "bg-yellow-100" :
                          statusData.status === "failed" ? "bg-red-100" : "bg-gray-100"
                        }`}>
                          {getStatusIcon(statusData.status)}
                        </div>
                        <div>
                          <p className="text-xs font-body uppercase tracking-wide text-gray-500">Model ID</p>
                          <p className="text-lg font-heading font-bold text-gray-900">{statusData.id}</p>
                        </div>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold font-body ${getStatusBadgeClass(statusData.status)}`}>
                        {statusLabel(statusData.status)}
                      </span>
                    </div>

                    {/* Progress bar for training/queued */}
                    {(statusData.status === "training" || statusData.status === "queued") && (
                      <div className="mb-4">
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${
                            statusData.status === "training" 
                              ? "bg-blue-500 animate-pulse w-2/3" 
                              : "bg-yellow-500 w-1/4"
                          }`} />
                        </div>
                        <p className="text-xs text-gray-500 font-body mt-1">
                          {statusData.status === "training" ? "Training in progress..." : "Waiting in queue..."}
                        </p>
                      </div>
                    )}

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <p className="text-xs font-body text-gray-500 uppercase tracking-wide">Type</p>
                        <p className="text-sm font-body font-semibold text-gray-800 capitalize mt-1">
                          {statusData.model_type || "Unknown"}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <p className="text-xs font-body text-gray-500 uppercase tracking-wide">Last Updated</p>
                        <p className="text-sm font-body font-semibold text-gray-800 mt-1">
                          {formatDateTime(statusData.updated_at)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Status Message */}
                  {statusData.status === "ready" && (
                    <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                      <FiCheck className="text-green-600" />
                      <p className="text-green-700 font-body text-sm">
                        Model is ready for predictions!
                      </p>
                    </div>
                  )}
                  {statusData.status === "failed" && (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                      <FiX className="text-red-600" />
                      <p className="text-red-700 font-body text-sm">
                        Training failed. Please try again.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              {statusData?.status === "ready" && onNavigateToPredict && (
                <button
                  onClick={() => {
                    closeStatusModal();
                    onNavigateToPredict(statusData.id);
                  }}
                  className="flex items-center gap-2 bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg font-body font-semibold transition-colors cursor-pointer"
                >
                  <FiZap />
                  Make Prediction
                </button>
              )}
              <button
                onClick={closeStatusModal}
                className="px-4 py-2 rounded-lg border border-gray-300 font-body font-semibold text-gray-700 hover:bg-gray-100 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

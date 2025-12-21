"use client";
import { useState, useEffect, useRef } from "react";
import { FiSearch, FiCheck, FiX, FiClock, FiLoader, FiAlertTriangle } from "react-icons/fi"; // Icons for representing model status and actions (search, success, error, loading, warning)

export default function ModelStatus() {
  const [modelId, setModelId] = useState("");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [autoPoll, setAutoPoll] = useState(true);
  const intervalRef = useRef(null);

  const fetchStatus = async (id) => {
    if (!id) return;

    if (!intervalRef.current) {
        setStatus(null);
        setError(null);
    }
    
    setLoading(true);
    try {
      const res = await fetch(`/api/ml/models/${id}`);
      const data = await res.json();

      if (res.ok) {
        setStatus(data);
        setError(null);
      } else if (res.status === 404) {
        setStatus(null);
        setError(data.message ? `Model "${id}" not found: ${data.message}` : `Model "${id}" not found`);
      } else {
        setError(data.message || "Failed to fetch status");
        setStatus(null);
      }
    } catch (err) {
      setError("Failed to connect to API");
      setStatus(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCheck = () => {
    if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
    }
    fetchStatus(modelId);
  };

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const shouldPoll =
      autoPoll &&
      status &&
      (status.status === "training" || status.status === "queued");

    if (shouldPoll) {
      intervalRef.current = setInterval(() => {
        fetchStatus(status.id);
      }, 5000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoPoll, status?.status, status?.id]);

  const getStatusIcon = (s) => {
    switch (s) {
      case "ready":
        return <FiCheck className="text-green-600" />;
      case "failed":
        return <FiX className="text-red-600" />;
      case "training":
        return <FiLoader className="text-blue-600 animate-spin" />;
      case "queued":
        return <FiClock className="text-yellow-600" />;
      default:
        return null;
    }
  };
  
  const getStatusBadge = (s) => {
    let colorClass = "bg-gray-100 text-gray-800";
    let icon = <FiLoader className="inline mr-1" />;

    switch (s) {
      case "ready":
        colorClass = "bg-green-100 text-green-800";
        icon = <FiCheck className="inline mr-1" />;
        break;
      case "failed":
        colorClass = "bg-red-100 text-red-800";
        icon = <FiX className="inline mr-1" />;
        break;
      case "training":
        colorClass = "bg-blue-100 text-blue-800";
        icon = <FiLoader className="inline mr-1 animate-spin" />;
        break;
      case "queued":
        colorClass = "bg-yellow-100 text-yellow-800";
        icon = <FiClock className="inline mr-1" />;
        break;
      default:
        colorClass = "bg-gray-100 text-gray-800";
        icon = <FiLoader className="inline mr-1" />;
    }

    return (
      <span
        className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full ${colorClass}`}
      >
        {icon}
        {s.charAt(0).toUpperCase() + s.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };


  return (
    <div className="p-6 bg-white shadow-xl rounded-xl max-w-xl mx-auto border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Model Status Checker
      </h2>

      {/* 1. Model ID Input dan Check Button */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Model ID</label>
        <div className="flex space-x-3">
          <input
            type="text"
            placeholder="Type model ID here..."
            value={modelId}
            onChange={(e) => setModelId(e.target.value)}
            onKeyDown={(e) => {
                if (e.key === 'Enter') handleCheck();
            }}
            className="flex-grow p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-800"
            disabled={loading}
          />
          <button
            onClick={handleCheck}
            className={`px-6 py-3 rounded-lg text-white font-medium transition duration-150 flex items-center justify-center ${
              modelId.trim() === "" || loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
            disabled={modelId.trim() === "" || loading}
          >
            {loading && !status ? (
              <FiLoader className="animate-spin mr-2" />
            ) : (
              <FiSearch className="mr-2" />
            )}
            Check
          </button>
        </div>
      </div>

      {/* 2. Error State (Not Found) */}
      {error && (
        <div className="p-5 mb-6 bg-red-50 border border-red-300 text-red-800 rounded-lg">
          <div className="flex items-start">
            <FiAlertTriangle className="mt-1 mr-3 flex-shrink-0 text-xl" />
            <div>
              <p className="font-semibold mb-1">
                ❌ Model &quot;{modelId}&quot; not found
              </p>
              <p className="text-sm">
                Make sure the model ID is correct, or create a new model in the
                &quot;Train Model&quot; tab.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3. Status Display Card*/}
      {status && !error && (
        <div className="p-5 mb-6 border border-gray-200 rounded-lg shadow-md bg-white">
          <div className="space-y-4">
            {/* Model ID */}
            <div className="grid grid-cols-2 gap-4 border-b pb-2">
              <span className="font-medium text-gray-600">Model ID</span>
              <span className="text-right text-gray-800 font-mono break-all">{status.id}</span>
            </div>

            {/* Status badge */}
            <div className="grid grid-cols-2 gap-4 border-b pb-2">
              <span className="font-medium text-gray-600">Status</span>
              <span className="text-right">
                {getStatusBadge(status.status)}
              </span>
            </div>

            {/* Model Type */}
            <div className="grid grid-cols-2 gap-4 border-b pb-2">
              <span className="font-medium text-gray-600">Type</span>
              <span className="text-right text-gray-800 capitalize">
                {status.model_type}
              </span>
            </div>

            {/* Last Updated */}
            <div className="grid grid-cols-2 gap-4">
              <span className="font-medium text-gray-600">Last Updated</span>
              <span className="text-right text-gray-800">
                {formatDate(status.updated_at)}
              </span>
            </div>

            {/* Progress Indicator (Training/Queued) */}
            {(status.status === "training" || status.status === "queued") && (
              <div className="pt-4 border-t mt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className={`font-medium ${status.status === 'training' ? 'text-blue-600' : 'text-yellow-600'}`}>
                    {status.status === "training"
                      ? "Training..."
                      : "Queued..."}
                  </span>
                </div>
                <div className={`h-2 rounded-full ${status.status === 'training' ? 'bg-blue-200' : 'bg-yellow-200'} overflow-hidden`}>
                    {/* Progress bar visual - Simple Animated Bar */}
                    <div
                        className={`h-2 rounded-full ${status.status === 'training' ? 'bg-blue-600 animate-pulse' : 'bg-yellow-600'}`}
                        // Gunakan lebar sederhana untuk visualisasi progress
                        style={{ width: '40%' }} 
                    ></div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Auto-poll Toggle */}
      <div className="mt-5 pt-3 border-t">
        <label className="flex items-center space-x-2 text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={autoPoll}
            onChange={(e) => setAutoPoll(e.target.checked)}
            className="form-checkbox h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <span>
            Auto-refresh while {status?.status === 'queued' ? 'queued' : 'training'} (every 5s)
          </span>
        </label>
      </div>
    </div>
  );
}
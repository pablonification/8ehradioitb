"use client";

import { useState, useEffect } from "react";
import {
  FiZap,
  FiPlus,
  FiTrash2,
  FiRefreshCw,
  FiAlertCircle,
} from "react-icons/fi";

/**
 * PredictionPlayground Component
 *
 * Feature 5: Prediction Playground
 * Assigned to: Arqila
 *
 * API Endpoints:
 * - GET /api/ml/models (to get list of ready models)
 * - POST /api/ml/predictions/[id] (make predictions)
 */

// Default features for different model types
const MODEL_FEATURES = {
  listener_engagement: [
    { name: "age", label: "Age", type: "int", min: 15, max: 60 },
    {
      name: "hours_listened",
      label: "Hours Listened",
      type: "float",
      min: 0,
      max: 50,
    },
    { name: "days_active", label: "Days Active", type: "int", min: 1, max: 30 },
    {
      name: "favorite_genre",
      label: "Favorite Genre",
      type: "int",
      min: 0,
      max: 4,
    },
  ],
  podcast_popularity: [
    {
      name: "duration_mins",
      label: "Duration (mins)",
      type: "int",
      min: 10,
      max: 120,
    },
    { name: "num_tags", label: "Number of Tags", type: "int", min: 1, max: 10 },
    {
      name: "publish_hour",
      label: "Publish Hour",
      type: "int",
      min: 0,
      max: 23,
    },
    {
      name: "host_experience_years",
      label: "Host Experience (years)",
      type: "int",
      min: 0,
      max: 10,
    },
  ],
  chart_movement: [
    {
      name: "current_position",
      label: "Current Position",
      type: "int",
      min: 1,
      max: 100,
    },
    {
      name: "weeks_on_chart",
      label: "Weeks on Chart",
      type: "int",
      min: 1,
      max: 52,
    },
    {
      name: "genre_popularity",
      label: "Genre Popularity",
      type: "float",
      min: 0,
      max: 1,
    },
    {
      name: "social_mentions",
      label: "Social Mentions",
      type: "int",
      min: 0,
      max: 10000,
    },
  ],
  // Default fallback
  default: [
    { name: "feature_1", label: "Feature 1", type: "float", min: 0, max: 100 },
    { name: "feature_2", label: "Feature 2", type: "float", min: 0, max: 100 },
    { name: "feature_3", label: "Feature 3", type: "float", min: 0, max: 100 },
  ],
};

// Prediction labels for classification models
const PREDICTION_LABELS = {
  listener_engagement: {
    1: { label: "Will Return", icon: "✅" },
    0: { label: "Won't Return", icon: "❌" },
  },
  podcast_popularity: {
    1: { label: "Will Be Popular", icon: "🔥" },
    0: { label: "Not Popular", icon: "📉" },
  },
  default: {
    1: { label: "Positive", icon: "✅" },
    0: { label: "Negative", icon: "❌" },
  },
};

export default function PredictionPlayground() {
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [inputMode, setInputMode] = useState("random");
  const [inputData, setInputData] = useState([]);
  const [randomCount, setRandomCount] = useState(3);
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingModels, setLoadingModels] = useState(true);
  const [error, setError] = useState(null);

  // Get features based on model name
  const getModelFeatures = (modelId) => {
    if (!modelId) return MODEL_FEATURES.default;

    const lowerModelId = modelId.toLowerCase();
    if (lowerModelId.includes("listener"))
      return MODEL_FEATURES.listener_engagement;
    if (lowerModelId.includes("podcast"))
      return MODEL_FEATURES.podcast_popularity;
    if (lowerModelId.includes("chart")) return MODEL_FEATURES.chart_movement;
    return MODEL_FEATURES.default;
  };

  // Get prediction label based on model type
  const getPredictionLabel = (modelId, pred) => {
    const lowerModelId = (modelId || "").toLowerCase();
    let labels = PREDICTION_LABELS.default;

    if (lowerModelId.includes("listener"))
      labels = PREDICTION_LABELS.listener_engagement;
    else if (lowerModelId.includes("podcast"))
      labels = PREDICTION_LABELS.podcast_popularity;

    // For classification (0 or 1)
    if (pred === 0 || pred === 1) {
      return labels[pred] || { label: String(pred), icon: "📊" };
    }

    // For regression (numeric)
    return { label: `Score: ${pred}`, icon: "📊" };
  };

  const currentFeatures = getModelFeatures(selectedModel);

  // Load ready models
  useEffect(() => {
    const fetchModels = async () => {
      setLoadingModels(true);
      try {
        const res = await fetch("/api/ml/models");
        const data = await res.json();
        const readyModels = (data.models || []).filter(
          (m) => m.status === "ready",
        );
        setModels(readyModels);
        if (readyModels.length > 0) {
          setSelectedModel(readyModels[0].id);
        }
      } catch (err) {
        setError("Failed to load models");
      } finally {
        setLoadingModels(false);
      }
    };
    fetchModels();
  }, []);

  // Reset input data when model changes
  useEffect(() => {
    setInputData([]);
    setPredictions(null);
  }, [selectedModel]);

  const generateRandomValue = (feature) => {
    if (feature.type === "int") {
      return (
        Math.floor(Math.random() * (feature.max - feature.min + 1)) +
        feature.min
      );
    }
    return (
      Math.round(
        (Math.random() * (feature.max - feature.min) + feature.min) * 100,
      ) / 100
    );
  };

  const generateRandomRow = () => {
    const row = {};
    for (const feat of currentFeatures) {
      row[feat.name] = generateRandomValue(feat);
    }
    return row;
  };

  const handleGenerateRandom = () => {
    const newData = [];
    for (let i = 0; i < randomCount; i++) {
      newData.push(generateRandomRow());
    }
    setInputData(newData);
    setPredictions(null);
    setError(null);
  };

  const handleAddRow = () => {
    setInputData([...inputData, generateRandomRow()]);
    setPredictions(null);
  };

  const handleDeleteRow = (index) => {
    setInputData(inputData.filter((_, i) => i !== index));
    setPredictions(null);
  };

  const handleInputChange = (index, field, value) => {
    const newData = [...inputData];
    newData[index] = { ...newData[index], [field]: parseFloat(value) || 0 };
    setInputData(newData);
    setPredictions(null);
  };

  const handlePredict = async () => {
    if (!selectedModel || inputData.length === 0) return;

    setLoading(true);
    setError(null);
    setPredictions(null);

    try {
      const res = await fetch(`/api/ml/predictions/${selectedModel}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input_data: inputData }),
      });
      const data = await res.json();

      if (res.ok) {
        setPredictions(data);
      } else {
        setError(data.message || "Prediction failed");
      }
    } catch (err) {
      setError("Failed to make prediction");
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshModels = async () => {
    setLoadingModels(true);
    try {
      const res = await fetch("/api/ml/models");
      const data = await res.json();
      const readyModels = (data.models || []).filter(
        (m) => m.status === "ready",
      );
      setModels(readyModels);
    } catch (err) {
      setError("Failed to refresh models");
    } finally {
      setLoadingModels(false);
    }
  };

  // Loading state
  if (loadingModels) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin text-4xl mb-4">⏳</div>
        <p className="text-gray-500 font-body">Loading models...</p>
      </div>
    );
  }

  // No ready models
  if (models.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🤖</div>
        <h3 className="text-xl font-heading font-semibold text-gray-800 mb-2">
          No Ready Models Available
        </h3>
        <p className="text-gray-500 font-body mb-4">
          Train a model first in the "Train Model" tab
        </p>
        <button
          onClick={handleRefreshModels}
          className="inline-flex items-center gap-2 text-red-600 hover:text-red-700 font-body font-medium"
        >
          <FiRefreshCw size={16} />
          Refresh Models
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Model Selection */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 font-body mb-1">
              Select Model
            </label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 font-body text-gray-900 focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              {models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.id} ({model.model_type || "unknown"})
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleRefreshModels}
            disabled={loadingModels}
            className="self-end p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
            title="Refresh models"
          >
            <FiRefreshCw
              size={20}
              className={loadingModels ? "animate-spin" : ""}
            />
          </button>
        </div>
      </div>

      {/* Input Mode Toggle */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 font-body mb-3">
          Input Mode
        </label>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="inputMode"
              value="manual"
              checked={inputMode === "manual"}
              onChange={(e) => setInputMode(e.target.value)}
              className="w-4 h-4 text-red-600 focus:ring-red-500"
            />
            <span className="font-body text-gray-700">Manual Input</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="inputMode"
              value="random"
              checked={inputMode === "random"}
              onChange={(e) => setInputMode(e.target.value)}
              className="w-4 h-4 text-red-600 focus:ring-red-500"
            />
            <span className="font-body text-gray-700">Random Generate</span>
          </label>
        </div>

        {/* Random Generator Controls */}
        {inputMode === "random" && (
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-body text-gray-600">
                Number of samples:
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={randomCount}
                onChange={(e) =>
                  setRandomCount(
                    Math.min(10, Math.max(1, parseInt(e.target.value) || 1)),
                  )
                }
                className="w-20 border border-gray-300 rounded-lg px-3 py-1 font-body text-gray-900 focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
            <button
              onClick={handleGenerateRandom}
              className="inline-flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-body font-semibold transition-colors cursor-pointer"
            >
              🎲 Generate
            </button>
          </div>
        )}
      </div>

      {/* Input Data Table */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h3 className="text-lg font-heading font-semibold text-gray-800">
            📥 Input Data {inputData.length > 0 && `(${inputData.length} rows)`}
          </h3>
          <button
            onClick={handleAddRow}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-body text-sm font-semibold transition-colors cursor-pointer"
          >
            <FiPlus size={16} />
            Add Row
          </button>
        </div>

        {inputData.length === 0 ? (
          <div className="text-center py-8 text-gray-500 font-body">
            <p>No input data yet.</p>
            <p className="text-sm mt-1">
              {inputMode === "random"
                ? 'Click "Generate" to create random input data.'
                : 'Click "Add Row" to add input data manually.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-3 py-2 text-left font-body font-semibold text-gray-700">
                    #
                  </th>
                  {currentFeatures.map((feat) => (
                    <th
                      key={feat.name}
                      className="px-3 py-2 text-left font-body font-semibold text-gray-700"
                    >
                      {feat.label}
                    </th>
                  ))}
                  <th className="px-3 py-2 text-center font-body font-semibold text-gray-700">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {inputData.map((row, index) => (
                  <tr
                    key={index}
                    className="border-t border-gray-200 hover:bg-gray-50"
                  >
                    <td className="px-3 py-2 font-body text-gray-600">
                      {index + 1}
                    </td>
                    {currentFeatures.map((feat) => (
                      <td key={feat.name} className="px-3 py-2">
                        <input
                          type="number"
                          step={feat.type === "float" ? "0.01" : "1"}
                          value={row[feat.name] ?? ""}
                          onChange={(e) =>
                            handleInputChange(index, feat.name, e.target.value)
                          }
                          className="w-24 border border-gray-300 rounded px-2 py-1 font-body text-gray-900 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        />
                      </td>
                    ))}
                    <td className="px-3 py-2 text-center">
                      <button
                        onClick={() => handleDeleteRow(index)}
                        className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                        title="Delete row"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg font-body">
          <FiAlertCircle size={20} />
          {error}
        </div>
      )}

      {/* Predict Button */}
      <div className="flex justify-center">
        <button
          onClick={handlePredict}
          disabled={loading || inputData.length === 0}
          className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-body font-bold text-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <span className="animate-spin">⏳</span>
              Predicting...
            </>
          ) : (
            <>
              <FiZap size={20} />
              Predict
            </>
          )}
        </button>
      </div>

      {/* Prediction Results */}
      {predictions && (
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <h3 className="text-lg font-heading font-semibold text-gray-800 mb-4">
            📤 Prediction Results
          </h3>
          <div className="space-y-2">
            {predictions.predictions.map((pred, index) => {
              const predLabel = getPredictionLabel(selectedModel, pred);
              const inputRow = inputData[index];
              const inputSummary = currentFeatures
                .map((f) => `${f.label}=${inputRow?.[f.name] ?? "?"}`)
                .join(", ");

              return (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row sm:items-center gap-2 bg-white rounded-lg p-3 border border-green-100"
                >
                  <span className="font-body text-gray-600 text-sm flex-1">
                    <strong>#{index + 1}:</strong> {inputSummary}
                  </span>
                  <span className="font-body font-semibold text-gray-800">
                    → {predLabel.icon} {predLabel.label}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-3 border-t border-green-200 text-sm text-gray-600 font-body">
            Total predictions: {predictions.count} | Model:{" "}
            {predictions.model_id}
          </div>
        </div>
      )}
    </div>
  );
}

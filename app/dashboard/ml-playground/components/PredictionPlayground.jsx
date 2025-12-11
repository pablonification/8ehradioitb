"use client";

import { useState, useEffect } from "react";
import {
  FiZap,
  FiPlus,
  FiTrash2,
  FiRefreshCw,
  FiAlertCircle,
  FiInfo,
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

// Feature configurations for different scenarios
const SCENARIO_FEATURES = {
  listener_engagement: {
    name: "Listener Engagement",
    features: [
      { name: "age", label: "Age", type: "int", min: 15, max: 60 },
      {
        name: "hours_listened",
        label: "Hours Listened",
        type: "float",
        min: 0,
        max: 50,
      },
      {
        name: "days_active",
        label: "Days Active",
        type: "int",
        min: 1,
        max: 30,
      },
      {
        name: "favorite_genre",
        label: "Favorite Genre",
        type: "int",
        min: 0,
        max: 4,
      },
    ],
    keywords: ["listener", "engagement", "return", "churn"],
    predictionLabels: {
      1: { label: "Will Return", icon: "✅" },
      0: { label: "Won't Return", icon: "❌" },
    },
  },
  podcast_popularity: {
    name: "Podcast Popularity",
    features: [
      {
        name: "duration_mins",
        label: "Duration (mins)",
        type: "int",
        min: 10,
        max: 120,
      },
      {
        name: "num_tags",
        label: "Number of Tags",
        type: "int",
        min: 1,
        max: 10,
      },
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
    keywords: ["podcast", "popularity", "popular", "episode"],
    predictionLabels: {
      1: { label: "Will Be Popular", icon: "🔥" },
      0: { label: "Not Popular", icon: "📉" },
    },
  },
  chart_movement: {
    name: "Chart Movement",
    features: [
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
    keywords: ["chart", "movement", "position", "song", "music"],
    predictionLabels: {},
  },
};

// Try to detect scenario from model ID
const detectScenario = (modelId) => {
  if (!modelId) return null;
  const lowerModelId = modelId.toLowerCase();

  for (const [scenarioId, scenario] of Object.entries(SCENARIO_FEATURES)) {
    if (scenario.keywords.some((keyword) => lowerModelId.includes(keyword))) {
      return scenarioId;
    }
  }
  return null;
};

export default function PredictionPlayground() {
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedScenario, setSelectedScenario] = useState(
    "listener_engagement",
  );
  const [scenarioMode, setScenarioMode] = useState("auto"); // 'auto' or 'manual'
  const [inputMode, setInputMode] = useState("random");
  const [inputData, setInputData] = useState([]);
  const [randomCount, setRandomCount] = useState(3);
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingModels, setLoadingModels] = useState(true);
  const [error, setError] = useState(null);

  // Get current features based on scenario
  const currentScenario = SCENARIO_FEATURES[selectedScenario];
  const currentFeatures = currentScenario?.features || [];

  // Detect scenario when model changes
  useEffect(() => {
    if (scenarioMode === "auto" && selectedModel) {
      const detected = detectScenario(selectedModel);
      if (detected) {
        setSelectedScenario(detected);
      }
    }
  }, [selectedModel, scenarioMode]);

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
        
        const preSelectedModel = typeof window !== "undefined" 
          ? window.sessionStorage.getItem("selectedPredictModel") 
          : null;
        
        if (preSelectedModel && readyModels.some(m => m.id === preSelectedModel)) {
          setSelectedModel(preSelectedModel);
          window.sessionStorage.removeItem("selectedPredictModel");
          const detected = detectScenario(preSelectedModel);
          if (detected) {
            setSelectedScenario(detected);
          }
        } 
        
        else if (readyModels.length > 0) {
          setSelectedModel(readyModels[0].id);
          // Try to detect scenario for first model
          const detected = detectScenario(readyModels[0].id);
          if (detected) {
            setSelectedScenario(detected);
          }
        }
      } catch (err) {
        setError("Failed to load models");
      } finally {
        setLoadingModels(false);
      }
    };
    fetchModels();
  }, []);

  // Reset input data when scenario changes
  useEffect(() => {
    setInputData([]);
    setPredictions(null);
    setError(null);
  }, [selectedScenario]);

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
        let errorMessage = "Prediction failed";
        
        if (res.status === 404) {
          errorMessage = data.message || data.detail || "Model not found";
        } else if (res.status === 422) {
          if (Array.isArray(data.detail) && data.detail.length > 0) {
            errorMessage = data.detail.map((d) => d.msg || String(d)).join(", ");
          } else if (typeof data.detail === "string") {
            errorMessage = data.detail;
          } else {
            errorMessage = data.message || "Model is not ready for predictions";
          }
        } else {
          if (typeof data.message === "string") {
            errorMessage = data.message;
          } else if (typeof data.error === "string") {
            errorMessage = data.error;
          } else if (typeof data.detail === "string") {
            errorMessage = data.detail;
          }
        }
        
        setError(errorMessage);
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

  const getPredictionLabel = (pred) => {
    const labels = currentScenario?.predictionLabels || {};

    // For classification (0 or 1)
    if (pred === 0 || pred === 1) {
      return (
        labels[pred] || {
          label: pred === 1 ? "Positive" : "Negative",
          icon: pred === 1 ? "✅" : "❌",
        }
      );
    }

    // For regression (numeric)
    return {
      label: `Score: ${typeof pred === "number" ? pred.toFixed(2) : pred}`,
      icon: "📊",
    };
  };

  // Check if scenario was auto-detected
  const detectedScenario = detectScenario(selectedModel);
  const isScenarioDetected = detectedScenario !== null;

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
          Train a model first in the &quot;Train Model&quot; tab
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

      {/* Scenario Selection - Important for matching features! */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 font-body mb-1">
              Feature Schema
            </label>
            <p className="text-xs text-gray-500 font-body">
              Select the feature schema that matches how the model was trained.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1 cursor-pointer text-sm">
              <input
                type="checkbox"
                checked={scenarioMode === "manual"}
                onChange={(e) =>
                  setScenarioMode(e.target.checked ? "manual" : "auto")
                }
                className="w-4 h-4 text-red-600 focus:ring-red-500 rounded"
              />
              <span className="font-body text-gray-600">Manual Override</span>
            </label>
          </div>
        </div>

        <select
          value={selectedScenario}
          onChange={(e) => setSelectedScenario(e.target.value)}
          disabled={scenarioMode === "auto"}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 font-body text-gray-900 focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          {Object.entries(SCENARIO_FEATURES).map(([id, scenario]) => (
            <option key={id} value={id}>
              {scenario.name}
            </option>
          ))}
        </select>

        {/* Warning if model name doesn't match scenario */}
        {!isScenarioDetected && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <FiAlertCircle
                className="text-yellow-600 mt-0.5 flex-shrink-0"
                size={16}
              />
              <div className="text-sm text-yellow-700 font-body">
                <strong>Warning:</strong> Model name &quot;{selectedModel}&quot;
                doesn&apos;t match any known scenario. Please enable
                &quot;Manual Override&quot; and select the correct feature
                schema that was used during training.
              </div>
            </div>
          </div>
        )}

        {/* Show current features */}
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <FiInfo className="text-blue-500 mt-0.5 flex-shrink-0" size={16} />
            <div className="text-sm text-blue-700 font-body">
              <strong>Features:</strong>{" "}
              {currentFeatures.map((f) => f.name).join(", ")}
            </div>
          </div>
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
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg font-body">
          <FiAlertCircle size={20} className="flex-shrink-0 mt-0.5" />
          <div>
            <p>{typeof error === "string" ? error : JSON.stringify(error)}</p>
            {typeof error === "string" && error.includes("feature") && (
              <p className="text-sm mt-1">
                Tip: Make sure the feature schema matches how the model was
                trained. Try enabling &quot;Manual Override&quot; and selecting
                the correct schema.
              </p>
            )}
          </div>
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
              const predLabel = getPredictionLabel(pred);
              const inputRow = inputData[index];
              const inputSummary = currentFeatures
                .map((f) => `${f.name}=${inputRow?.[f.name] ?? "?"}`)
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

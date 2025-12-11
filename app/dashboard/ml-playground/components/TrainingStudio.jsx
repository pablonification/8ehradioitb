"use client";

import { useState, useEffect } from "react";
import {
  FiDatabase,
  FiZap,
  FiRefreshCw,
  FiAlertCircle,
  FiCheck,
  FiInfo,
} from "react-icons/fi";

export default function TrainingStudio() {
  const [scenarios, setScenarios] = useState([]);
  const [selectedScenario, setSelectedScenario] = useState("");
  const [modelId, setModelId] = useState("");
  const [sampleSize, setSampleSize] = useState(100);
  const [generatedData, setGeneratedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingScenarios, setLoadingScenarios] = useState(true);
  const [generatingData, setGeneratingData] = useState(false);
  const [trainingStatus, setTrainingStatus] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchScenarios = async () => {
      setLoadingScenarios(true);
      try {
        const res = await fetch("/api/ml/generate-dummy");
        if (!res.ok) throw new Error("Failed to fetch scenarios");
        const data = await res.json();
        setScenarios(data.scenarios || []);
        if (data.scenarios?.length > 0) {
          setSelectedScenario(data.scenarios[0].id);
        }
      } catch (err) {
        setError("Failed to load scenarios");
      } finally {
        setLoadingScenarios(false);
      }
    };
    fetchScenarios();
  }, []);

  useEffect(() => {
    setGeneratedData(null);
    setTrainingStatus(null);
    setError(null);
  }, [selectedScenario]);

  const handleGenerateData = async () => {
    if (!selectedScenario) return;
    setGeneratingData(true);
    setError(null);
    setGeneratedData(null);
    setTrainingStatus(null);

    try {
      const res = await fetch("/api/ml/generate-dummy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenario: selectedScenario,
          sample_size: sampleSize,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setGeneratedData(data);
      } else {
        setError(data.message || "Failed to generate data");
      }
    } catch (err) {
      setError("Failed to generate data");
    } finally {
      setGeneratingData(false);
    }
  };

  const handleStartTraining = async () => {
    if (!modelId.trim()) {
      setError("Model ID is required");
      return;
    }
    if (!generatedData) {
      setError("Please generate training data first");
      return;
    }

    setLoading(true);
    setError(null);
    setTrainingStatus(null);

    try {
      const res = await fetch("/api/ml/training", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: modelId.trim(),
          target_col: generatedData.target_col,
          training_data: generatedData.data,
        }),
      });
      const data = await res.json();

      if (res.ok || res.status === 202) {
        setTrainingStatus({ success: true, ...data });
      } else {
        if (res.status === 409) {
          setTrainingStatus({
            success: false,
            message: `Model ID "${modelId}" already exists. Choose a different name.`,
          });
        } else {
          setTrainingStatus({
            success: false,
            message: data.message || "Training failed to start",
          });
        }
      }
    } catch (err) {
      setTrainingStatus({
        success: false,
        message: "Failed to connect to ML API",
      });
    } finally {
      setLoading(false);
    }
  };

  const currentScenario = scenarios.find((s) => s.id === selectedScenario);

  if (loadingScenarios) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin text-4xl mb-4">⏳</div>
        <p className="text-gray-500 font-body">Loading scenarios...</p>
      </div>
    );
  }

  if (scenarios.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">⚠️</div>
        <h3 className="text-xl font-heading font-semibold text-gray-800 mb-2">
          No Training Scenarios Available
        </h3>
        <p className="text-gray-500 font-body">
          Unable to load training scenarios from the API.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Model ID Input */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <label
          htmlFor="model-id"
          className="block text-sm font-medium text-gray-700 font-body mb-1"
        >
          Model ID <span className="text-red-500">*</span>
        </label>
        <input
          id="model-id"
          type="text"
          value={modelId}
          onChange={(e) => setModelId(e.target.value)}
          placeholder="e.g., listener-model-v1"
          aria-describedby="model-id-description"
          aria-required="true"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 font-body text-gray-900 focus:ring-2 focus:ring-red-500 focus:border-red-500"
        />
        <p
          id="model-id-description"
          className="text-xs text-gray-500 font-body mt-1"
        >
          Unique identifier for your model. Use lowercase and hyphens.
        </p>
      </div>

      {/* Scenario Selection */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 font-body mb-1">
          Training Scenario
        </label>
        <select
          value={selectedScenario}
          onChange={(e) => setSelectedScenario(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 font-body text-gray-900 focus:ring-2 focus:ring-red-500 focus:border-red-500"
        >
          {scenarios.map((scenario) => (
            <option key={scenario.id} value={scenario.id}>
              {scenario.name}
            </option>
          ))}
        </select>

        {currentScenario && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <FiInfo className="text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-blue-800 font-body">
                  {currentScenario.description}
                </p>
                <div className="flex flex-wrap gap-3 mt-2 text-xs font-body text-blue-600">
                  <span className="bg-blue-100 px-2 py-0.5 rounded">
                    Type: {currentScenario.model_type}
                  </span>
                  <span className="bg-blue-100 px-2 py-0.5 rounded">
                    Target: {currentScenario.target_col}
                  </span>
                </div>
                <div className="mt-2 text-xs font-body text-blue-600">
                  Features:{" "}
                  {currentScenario.features?.map((f) => f.name).join(", ")}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sample Size */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <label
          htmlFor="sample-size"
          className="block text-sm font-medium text-gray-700 font-body mb-1"
        >
          Sample Size:{" "}
          <span className="font-semibold text-red-600">{sampleSize}</span> rows
        </label>
        <input
          id="sample-size"
          type="range"
          min="50"
          max="500"
          step="10"
          value={sampleSize}
          onChange={(e) => setSampleSize(parseInt(e.target.value))}
          aria-label="Sample size"
          aria-valuemin={50}
          aria-valuemax={500}
          aria-valuenow={sampleSize}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-600"
        />
        <div className="flex justify-between text-xs text-gray-500 font-body mt-1">
          <span>50</span>
          <span>500</span>
        </div>
      </div>

      {/* Generate Data Button */}
      <div className="flex justify-center">
        <button
          onClick={handleGenerateData}
          disabled={generatingData || !selectedScenario}
          aria-label={
            generatingData ? "Generating training data" : "Generate training data"
          }
          className="inline-flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-5 py-2.5 rounded-lg font-body font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {generatingData ? (
            <>
              <FiRefreshCw className="animate-spin" size={18} />
              Generating...
            </>
          ) : (
            <>
              <FiDatabase size={18} />
              Generate Data
            </>
          )}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div
          role="alert"
          className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg font-body"
        >
          <FiAlertCircle size={20} />
          {error}
        </div>
      )}

      {/* Data Preview */}
      {generatedData && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100">
                {generatedData.features.map((feature) => (
                  <th
                    key={feature}
                    className="px-3 py-2 text-left font-body font-semibold text-gray-700"
                  >
                    {feature}
                  </th>
                ))}
                <th className="px-3 py-2 text-left font-body font-semibold text-green-700 bg-green-50">
                  {generatedData.target_col} (target)
                </th>
              </tr>
            </thead>
            <tbody>
              {generatedData.data.slice(0, 5).map((row, index) => (
                <tr
                  key={index}
                  className="border-t border-gray-200 hover:bg-gray-50"
                >
                  {generatedData.features.map((feature) => (
                    <td
                      key={feature}
                      className="px-3 py-2 font-body text-gray-800"
                    >
                      {typeof row[feature] === "number"
                        ? Number.isInteger(row[feature])
                          ? row[feature]
                          : row[feature].toFixed(2)
                        : row[feature]}
                    </td>
                  ))}
                  <td className="px-3 py-2 font-body font-semibold text-green-700 bg-green-50">
                    {row[generatedData.target_col]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500 font-body">
            <span className="bg-gray-200 px-2 py-1 rounded">
              Total rows: {generatedData.sample_size}
            </span>
            <span className="bg-gray-200 px-2 py-1 rounded">
              Features: {generatedData.features.length}
            </span>
            <span className="bg-gray-200 px-2 py-1 rounded">
              Model type: {generatedData.model_type}
            </span>
          </div>
        </div>
      )}

      {/* Start Training Button */}
      {generatedData && (
        <div className="flex justify-center">
          <button
            onClick={handleStartTraining}
            disabled={loading || !modelId.trim()}
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-body font-bold text-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <span className="animate-spin">⏳</span>
                Starting Training...
              </>
            ) : (
              <>
                <FiZap size={20} />
                🚀 Start Training
              </>
            )}
          </button>
        </div>
      )}

      {/* Training Status */}
      {trainingStatus && (
        <div
          className={`rounded-lg p-4 border ${
            trainingStatus.success
              ? "bg-green-50 border-green-200"
              : "bg-red-50 border-red-200"
          }`}
        >
          <div className="flex items-start gap-3">
            {trainingStatus.success ? (
              <FiCheck className="text-green-600 mt-0.5" size={20} />
            ) : (
              <FiAlertCircle className="text-red-600 mt-0.5" size={20} />
            )}
            <div>
              <h4
                className={`font-heading font-semibold ${
                  trainingStatus.success ? "text-green-800" : "text-red-800"
                }`}
              >
                {trainingStatus.success ? "Training Started!" : "Training Failed"}
              </h4>
              <p
                className={`mt-1 text-sm font-body ${
                  trainingStatus.success ? "text-green-700" : "text-red-700"
                }`}
              >
                {trainingStatus.message}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

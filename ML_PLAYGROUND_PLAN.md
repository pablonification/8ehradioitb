# ML Playground - Implementation Plan

> **Project**: 8EH Radio ITB - ML Platform Integration  
> **Location**: `/dashboard/ml-playground`  
> **Access**: DEVELOPER role only

## Overview

Halaman dashboard untuk mengintegrasikan ML Platform API dengan 5 fitur utama. Setiap orang bertanggung jawab untuk **1 component**.

## File Structure

```
app/dashboard/ml-playground/
├── page.jsx                          # ✅ DONE (skeleton + tabs)
└── components/
    ├── HealthMonitor.jsx             # Surya
    ├── TrainingStudio.jsx            # Dhika
    ├── ModelGallery.jsx              # Omar
    ├── ModelStatus.jsx               # Lakmen
    └── PredictionPlayground.jsx      # Arqila
```

## API Endpoints (sudah ready)

| Endpoint                   | Method | Fungsi                       |
| -------------------------- | ------ | ---------------------------- |
| `/api/ml/health`           | GET    | Cek status API               |
| `/api/ml/models`           | GET    | List semua model             |
| `/api/ml/models/[id]`      | GET    | Cek status model tertentu    |
| `/api/ml/models/[id]`      | DELETE | Hapus model                  |
| `/api/ml/training`         | POST   | Train model baru             |
| `/api/ml/predictions/[id]` | POST   | Buat prediksi                |
| `/api/ml/generate-dummy`   | GET    | Get available scenarios      |
| `/api/ml/generate-dummy`   | POST   | Generate dummy training data |

## Common Styling Guide

Gunakan pattern yang konsisten dengan dashboard lainnya:

```jsx
// Container
<div className="space-y-6">

// Card/Section
<div className="bg-gray-50 rounded-lg p-4 border border-gray-200">

// Title
<h3 className="text-lg font-heading font-semibold text-gray-800">

// Label
<label className="block text-sm font-medium text-gray-700 font-body mb-1">

// Input
<input className="w-full border border-gray-300 rounded-lg px-3 py-2 font-body text-gray-900 focus:ring-2 focus:ring-red-500 focus:border-red-500" />

// Select
<select className="w-full border border-gray-300 rounded-lg px-3 py-2 font-body text-gray-900 focus:ring-2 focus:ring-red-500 focus:border-red-500">

// Primary Button
<button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-body font-semibold transition-colors cursor-pointer disabled:opacity-50">

// Secondary Button
<button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-body font-semibold transition-colors cursor-pointer">

// Success Badge
<span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-body">

// Error Badge
<span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm font-body">

// Warning Badge
<span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-sm font-body">

// Loading
<div className="text-center py-8 text-gray-500 font-body">Loading...</div>

// Error Message
<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg font-body">
```

## Icons (from react-icons/fi)

```jsx
import {
  FiRefreshCw, // Refresh
  FiCheck, // Success/Checkmark
  FiX, // Close/Error
  FiAlertCircle, // Warning
  FiTrash2, // Delete
  FiEye, // View
  FiZap, // Predict/Action
  FiPlus, // Add
  FiDatabase, // Data/Model
  FiClock, // Time/Pending
  FiLoader, // Loading spinner
} from "react-icons/fi";
```

---

# SURYA - Feature 1: API Health Monitor

## Component File

`app/dashboard/ml-playground/components/HealthMonitor.jsx`

## API Endpoint

- **GET `/api/ml/health`**

## Response Format

```json
// Success (200)
{
  "status": "ok",
  "timestamp": "2025-12-10T07:32:15.123Z",
  "version": "1.0.0"
}

// Error (503 - API offline)
{
  "error": "connection_failed",
  "message": "Failed to connect to ML API",
  "status": "offline"
}
```

## Requirements

### UI Elements

1. **Status Badge** - Hijau "Online" atau Merah "Offline"
2. **API Version** - Tampilkan versi dari response
3. **Last Checked** - Timestamp kapan terakhir dicek (format: "10 Dec 2025, 14:32:15")
4. **Refresh Button** - Manual refresh
5. **Auto-refresh Toggle** - Checkbox untuk auto-refresh setiap 30 detik

### Behavior

- Fetch health status saat component mount
- Tampilkan loading state saat fetching
- Handle error gracefully (tampilkan offline jika gagal connect)
- Auto-refresh jika toggle aktif

## Wireframe

```
┌─────────────────────────────────────────────────────────┐
│  API Health Monitor                                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │                                                 │    │
│  │  Status      ✅ Online                          │    │
│  │                                                 │    │
│  │  Version     1.0.0                              │    │
│  │                                                 │    │
│  │  Checked     10 Dec 2025, 14:32:15              │    │
│  │                                                 │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  [🔄 Refresh]     ☑️ Auto-refresh setiap 30 detik       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Starter Code

```jsx
"use client";

import { useState, useEffect } from "react";
import { FiRefreshCw, FiCheck, FiX } from "react-icons/fi";

export default function HealthMonitor() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ml/health");
      const data = await res.json();

      if (res.ok) {
        setHealth(data);
        setError(null);
      } else {
        setHealth(null);
        setError(data.message || "Failed to fetch health status");
      }
    } catch (err) {
      setHealth(null);
      setError("Failed to connect to API");
    } finally {
      setLoading(false);
      setLastChecked(new Date());
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const formatDate = (date) => {
    if (!date) return "-";
    return date.toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // TODO: Implement the UI based on wireframe above
  // Use health, loading, error, autoRefresh, lastChecked states

  return <div>{/* Implement your UI here */}</div>;
}
```

---

# DHIKA - Feature 2: Model Training Studio

## Component File

`app/dashboard/ml-playground/components/TrainingStudio.jsx`

## API Endpoints

### 1. GET `/api/ml/generate-dummy`

Get available training scenarios.

**Response:**

```json
{
  "scenarios": [
    {
      "id": "listener_engagement",
      "name": "Listener Engagement",
      "description": "Predict whether a listener will return to the radio station",
      "target_col": "will_return",
      "model_type": "classification",
      "features": [
        { "name": "age", "type": "int", "min": 15, "max": 60 },
        { "name": "hours_listened", "type": "float", "min": 0, "max": 50 },
        { "name": "days_active", "type": "int", "min": 1, "max": 30 },
        {
          "name": "favorite_genre",
          "type": "category",
          "values": [0, 1, 2, 3, 4]
        }
      ]
    }
    // ... more scenarios
  ]
}
```

### 2. POST `/api/ml/generate-dummy`

Generate dummy training data.

**Request:**

```json
{
  "scenario": "listener_engagement",
  "sample_size": 100
}
```

**Response:**

```json
{
  "scenario": "listener_engagement",
  "name": "Listener Engagement",
  "description": "...",
  "target_col": "will_return",
  "model_type": "classification",
  "features": ["age", "hours_listened", "days_active", "favorite_genre"],
  "sample_size": 100,
  "data": [
    {
      "age": 25,
      "hours_listened": 10.5,
      "days_active": 15,
      "favorite_genre": 2,
      "will_return": 1
    },
    {
      "age": 32,
      "hours_listened": 3.2,
      "days_active": 5,
      "favorite_genre": 0,
      "will_return": 0
    }
    // ... more rows
  ]
}
```

### 3. POST `/api/ml/training`

Start model training.

**Request:**

```json
{
  "id": "listener-model-v1",
  "target_col": "will_return",
  "training_data": [
    {
      "age": 25,
      "hours_listened": 10.5,
      "days_active": 15,
      "favorite_genre": 2,
      "will_return": 1
    }
    // ... at least 10 rows
  ]
}
```

**Response (202):**

```json
{
  "id": "listener-model-v1",
  "status": "queued",
  "message": "Training started"
}
```

## Requirements

### UI Elements

1. **Model ID Input** - Text input untuk nama model (required)
2. **Scenario Dropdown** - Select dari available scenarios
3. **Sample Size Slider** - Range 50-500, default 100
4. **Target Column Display** - Auto-filled dari scenario (readonly)
5. **Generate Data Button** - Generate dummy data
6. **Data Preview Table** - Tampilkan 5-10 row pertama dari generated data
7. **Train Button** - Submit training (disabled jika belum generate data)
8. **Status/Feedback** - Success/error message setelah submit

### Behavior

1. Load scenarios saat mount
2. Saat scenario dipilih, tampilkan info (name, description, target_col, model_type)
3. Generate data → tampilkan preview table
4. Train → submit ke API → tampilkan status
5. Validasi: model ID required, harus generate data dulu sebelum train

## Wireframe

```
┌─────────────────────────────────────────────────────────────────┐
│  Model Training Studio                                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Model ID *                                                     │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ listener-model-v1                                       │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  Scenario                                                       │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Listener Engagement                                   ▼ │    │
│  └─────────────────────────────────────────────────────────┘    │
│  ℹ️ Predict whether a listener will return to the radio station │
│  Type: classification | Target: will_return                     │
│                                                                 │
│  Sample Size: 100                                               │
│  ●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━●                    │
│  50                                        500                  │
│                                                                 │
│  [🎲 Generate Data]                                             │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 📊 Data Preview (showing 5 of 100 rows)                 │    │
│  ├───────┬────────────────┬─────────────┬──────────────────┤    │
│  │  age  │ hours_listened │ days_active │ will_return      │    │
│  ├───────┼────────────────┼─────────────┼──────────────────┤    │
│  │   25  │     10.50      │     15      │       1          │    │
│  │   32  │      3.20      │      5      │       0          │    │
│  │   19  │     25.00      │     22      │       1          │    │
│  │   45  │      1.50      │      2      │       0          │    │
│  │   28  │     18.75      │     18      │       1          │    │
│  └───────┴────────────────┴─────────────┴──────────────────┘    │
│                                                                 │
│  [🚀 Start Training]                                            │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ ✅ Training started! Model ID: listener-model-v1        │    │
│  │    Status: queued - Check Model Status tab for updates  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Starter Code

```jsx
"use client";

import { useState, useEffect } from "react";
import { FiDatabase, FiZap, FiRefreshCw } from "react-icons/fi";

export default function TrainingStudio() {
  const [scenarios, setScenarios] = useState([]);
  const [selectedScenario, setSelectedScenario] = useState("");
  const [modelId, setModelId] = useState("");
  const [sampleSize, setSampleSize] = useState(100);
  const [generatedData, setGeneratedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [trainingStatus, setTrainingStatus] = useState(null);
  const [error, setError] = useState(null);

  // Load scenarios on mount
  useEffect(() => {
    const fetchScenarios = async () => {
      try {
        const res = await fetch("/api/ml/generate-dummy");
        const data = await res.json();
        setScenarios(data.scenarios || []);
        if (data.scenarios?.length > 0) {
          setSelectedScenario(data.scenarios[0].id);
        }
      } catch (err) {
        setError("Failed to load scenarios");
      }
    };
    fetchScenarios();
  }, []);

  const handleGenerateData = async () => {
    if (!selectedScenario) return;

    setLoading(true);
    setError(null);
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
      setLoading(false);
    }
  };

  const handleStartTraining = async () => {
    if (!modelId || !generatedData) return;

    setLoading(true);
    setError(null);
    setTrainingStatus(null);

    try {
      const res = await fetch("/api/ml/training", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: modelId,
          target_col: generatedData.target_col,
          training_data: generatedData.data,
        }),
      });
      const data = await res.json();

      if (res.ok || res.status === 202) {
        setTrainingStatus({ success: true, ...data });
      } else {
        setTrainingStatus({
          success: false,
          message: data.message || "Training failed",
        });
      }
    } catch (err) {
      setTrainingStatus({
        success: false,
        message: "Failed to start training",
      });
    } finally {
      setLoading(false);
    }
  };

  const currentScenario = scenarios.find((s) => s.id === selectedScenario);

  // TODO: Implement the UI based on wireframe above

  return <div>{/* Implement your UI here */}</div>;
}
```

---

# OMAR - Feature 3: Model Gallery

## Component File

`app/dashboard/ml-playground/components/ModelGallery.jsx`

## API Endpoints

### 1. GET `/api/ml/models`

List all models.

**Response:**

```json
{
  "models": [
    {
      "id": "listener-model-v1",
      "status": "ready",
      "model_type": "classification",
      "updated_at": "2025-12-10T07:32:15Z"
    },
    {
      "id": "podcast-pop-v2",
      "status": "training",
      "model_type": "classification",
      "updated_at": "2025-12-10T08:15:00Z"
    },
    {
      "id": "chart-predict-v1",
      "status": "failed",
      "model_type": "regression",
      "updated_at": "2025-12-09T12:00:00Z"
    }
  ],
  "count": 3
}
```

### 2. DELETE `/api/ml/models/[id]`

Delete a model.

**Response (200):**

```json
{
  "id": "listener-model-v1",
  "status": "deleted",
  "message": "Model successfully deleted"
}
```

## Requirements

### UI Elements

1. **Header** - Title "Model Gallery" + Refresh button + Model count
2. **Model Cards Grid** - Card untuk setiap model
3. **Each Card shows**:
   - Model ID (bold)
   - Status badge (queued=yellow, training=blue, ready=green, failed=red)
   - Model type (classification/regression)
   - Last updated (relative time: "2 hours ago", "5 minutes ago")
   - Action buttons: View Status, Predict (only if ready), Delete
4. **Empty State** - Pesan jika belum ada model
5. **Delete Confirmation** - Confirm dialog sebelum delete

### Status Badge Colors

- `queued` → Yellow (bg-yellow-100 text-yellow-800)
- `training` → Blue (bg-blue-100 text-blue-800)
- `ready` → Green (bg-green-100 text-green-800)
- `failed` → Red (bg-red-100 text-red-800)

### Behavior

1. Load models saat mount
2. Refresh button → reload data
3. Delete → confirm → call API → reload
4. "View Status" → bisa emit event ke parent atau navigate ke tab status (optional, bisa skip)
5. "Predict" → hanya muncul jika status = "ready"

## Wireframe

```
┌─────────────────────────────────────────────────────────────────────┐
│  Model Gallery                                    [🔄] 3 models     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────┐  ┌─────────────────────────┐           │
│  │ listener-model-v1       │  │ podcast-pop-v2          │           │
│  │ ┌───────┐               │  │ ┌──────────┐            │           │
│  │ │ ready │ classification│  │ │ training │ classific. │           │
│  │ └───────┘               │  │ └──────────┘            │           │
│  │ Updated: 2 hours ago    │  │ Updated: 5 mins ago     │           │
│  │                         │  │                         │           │
│  │ [👁️ Status] [🎯 Predict]│  │ [👁️ Status]             │           │
│  │ [🗑️ Delete]             │  │ [🗑️ Delete]             │           │
│  └─────────────────────────┘  └─────────────────────────┘           │
│                                                                     │
│  ┌─────────────────────────┐                                        │
│  │ chart-predict-v1        │                                        │
│  │ ┌────────┐              │                                        │
│  │ │ failed │ regression   │                                        │
│  │ └────────┘              │                                        │
│  │ Updated: 1 day ago      │                                        │
│  │                         │                                        │
│  │ [👁️ Status]             │                                        │
│  │ [🗑️ Delete]             │                                        │
│  └─────────────────────────┘                                        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

// Empty State:
┌─────────────────────────────────────────────────────────────────────┐
│  Model Gallery                                    [🔄] 0 models     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                         📭                                          │
│                                                                     │
│                   No models yet                                     │
│         Go to "Train Model" tab to create your first model          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Starter Code

```jsx
"use client";

import { useState, useEffect } from "react";
import {
  FiRefreshCw,
  FiEye,
  FiZap,
  FiTrash2,
  FiDatabase,
} from "react-icons/fi";

export default function ModelGallery() {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // model id to delete

  const fetchModels = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ml/models");
      const data = await res.json();

      if (res.ok) {
        setModels(data.models || []);
        setError(null);
      } else {
        setError(data.message || "Failed to fetch models");
      }
    } catch (err) {
      setError("Failed to connect to API");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  const handleDelete = async (modelId) => {
    try {
      const res = await fetch(`/api/ml/models/${modelId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setDeleteConfirm(null);
        fetchModels(); // Reload list
      } else {
        const data = await res.json();
        setError(data.message || "Failed to delete model");
      }
    } catch (err) {
      setError("Failed to delete model");
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

  // TODO: Implement the UI based on wireframe above

  return <div>{/* Implement your UI here */}</div>;
}
```

---

# LAKMEN - Feature 4: Model Status Checker

## Component File

`app/dashboard/ml-playground/components/ModelStatus.jsx`

## API Endpoint

- **GET `/api/ml/models/[id]`**

**Response (200):**

```json
{
  "id": "listener-model-v1",
  "status": "ready",
  "model_type": "classification",
  "updated_at": "2025-12-10T07:32:15Z"
}
```

**Response (404):**

```json
{
  "error": "not_found",
  "message": "Model not found"
}
```

## Requirements

### UI Elements

1. **Model ID Input** - Text input untuk ketik model ID
2. **Check Button** - Cek status model
3. **Status Display Card**:
   - Model ID
   - Status badge (queued/training/ready/failed)
   - Model type
   - Last updated (formatted datetime)
4. **Auto-poll Toggle** - Jika status = training/queued, auto-refresh tiap 5 detik
5. **Progress Indicator** - Visual indicator saat status = training (bisa pake simple animated bar)
6. **Error State** - Tampilkan jika model not found

### Behavior

1. User ketik model ID → klik Check → fetch status
2. Jika status training/queued dan auto-poll aktif → refresh tiap 5 detik
3. Jika status ready/failed → stop auto-poll
4. Handle 404 (model not found) gracefully

## Wireframe

```
┌─────────────────────────────────────────────────────────────────┐
│  Model Status Checker                                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Model ID                                                       │
│  ┌───────────────────────────────────────────────┐ ┌──────────┐ │
│  │ listener-model-v1                             │ │ 🔍 Check │ │
│  └───────────────────────────────────────────────┘ └──────────┘ │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                                                         │    │
│  │  Model ID      listener-model-v1                        │    │
│  │                                                         │    │
│  │  Status        ⏳ training                              │    │
│  │                                                         │    │
│  │  Type          classification                           │    │
│  │                                                         │    │
│  │  Updated       10 Dec 2025, 14:32:15                    │    │
│  │                                                         │    │
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  Training...      │    │
│  │                                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ☑️ Auto-refresh while training (every 5s)                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

// Not found state:
┌─────────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                                                         │    │
│  │  ❌ Model "xyz-model" not found                         │    │
│  │                                                         │    │
│  │  Make sure the model ID is correct, or create a new     │    │
│  │  model in the "Train Model" tab.                        │    │
│  │                                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## Starter Code

```jsx
"use client";

import { useState, useEffect, useRef } from "react";
import { FiSearch, FiCheck, FiX, FiClock, FiLoader } from "react-icons/fi";

export default function ModelStatus() {
  const [modelId, setModelId] = useState("");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [autoPoll, setAutoPoll] = useState(true);
  const intervalRef = useRef(null);

  const fetchStatus = async (id) => {
    if (!id) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/ml/models/${id}`);
      const data = await res.json();

      if (res.ok) {
        setStatus(data);
        setError(null);
      } else if (res.status === 404) {
        setStatus(null);
        setError(`Model "${id}" not found`);
      } else {
        setError(data.message || "Failed to fetch status");
      }
    } catch (err) {
      setError("Failed to connect to API");
    } finally {
      setLoading(false);
    }
  };

  const handleCheck = () => {
    fetchStatus(modelId);
  };

  // Auto-poll effect
  useEffect(() => {
    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Start polling if conditions met
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

  const formatDate = (dateString) => {
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

  // TODO: Implement the UI based on wireframe above

  return <div>{/* Implement your UI here */}</div>;
}
```

---

# ARQILA - Feature 5: Prediction Playground

## Component File

`app/dashboard/ml-playground/components/PredictionPlayground.jsx`

## API Endpoints

### 1. GET `/api/ml/models`

Get list of models (to show ready models in dropdown).

### 2. POST `/api/ml/predictions/[id]`

Make predictions.

**Request:**

```json
{
  "input_data": [
    { "age": 28, "hours_listened": 12, "days_active": 20, "favorite_genre": 2 },
    { "age": 45, "hours_listened": 2, "days_active": 3, "favorite_genre": 0 }
  ]
}
```

**Response (200):**

```json
{
  "model_id": "listener-model-v1",
  "predictions": [1, 0],
  "count": 2
}
```

**Response (404):**

```json
{
  "error": "not_found",
  "message": "Model not found"
}
```

**Response (422):**

```json
{
  "error": "model_not_ready",
  "message": "Model is not ready for predictions"
}
```

## Requirements

### UI Elements

1. **Model Dropdown** - Select dari ready models only
2. **Input Mode Toggle** - "Manual" atau "Random Generate"
3. **Input Table** (Manual mode):
   - Editable table rows
   - Add row button
   - Delete row button per row
4. **Random Generator** (Random mode):
   - Count input (1-10)
   - Generate button
5. **Predict Button** - Submit prediction
6. **Results Display**:
   - Table showing input → prediction
   - For classification: 1/0 with label (e.g., "Will Return ✅" / "Won't Return ❌")
   - For regression: numeric value

### Behavior

1. Load models saat mount, filter hanya yang status = "ready"
2. Jika tidak ada ready model → tampilkan empty state
3. Manual mode: user bisa add/edit/delete input rows
4. Random mode: generate random input data based on feature ranges
5. Submit → tampilkan results

## Wireframe

```
┌─────────────────────────────────────────────────────────────────────┐
│  Prediction Playground                                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Select Model                                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ listener-model-v1 (ready)                                 ▼ │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  Input Mode:   ○ Manual    ● Random Generate                        │
│                                                                     │
│  Number of samples: [5    ]  [🎲 Generate]                          │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ 📥 Input Data                                    [➕ Add Row]│    │
│  ├───────┬────────────────┬─────────────┬───────────────┬──────┤    │
│  │  age  │ hours_listened │ days_active │ favorite_genre│      │    │
│  ├───────┼────────────────┼─────────────┼───────────────┼──────┤    │
│  │   28  │     12.00      │     20      │       2       │ [🗑️] │    │
│  │   45  │      2.50      │      3      │       0       │ [🗑️] │    │
│  │   22  │     30.00      │     25      │       1       │ [🗑️] │    │
│  └───────┴────────────────┴─────────────┴───────────────┴──────┘    │
│                                                                     │
│  [🚀 Predict]                                                       │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ 📤 Prediction Results                                       │    │
│  ├─────────────────────────────────────────────────────────────┤    │
│  │  #1: age=28, hours=12, days=20  →  1 (Will Return ✅)       │    │
│  │  #2: age=45, hours=2.5, days=3  →  0 (Won't Return ❌)      │    │
│  │  #3: age=22, hours=30, days=25  →  1 (Will Return ✅)       │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

// No ready models:
┌─────────────────────────────────────────────────────────────────────┐
│  Prediction Playground                                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                         🤖                                          │
│                                                                     │
│              No ready models available                              │
│     Train a model first in the "Train Model" tab                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Starter Code

```jsx
"use client";

import { useState, useEffect } from "react";
import { FiZap, FiPlus, FiTrash2, FiRefreshCw } from "react-icons/fi";

export default function PredictionPlayground() {
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [inputMode, setInputMode] = useState("random"); // 'manual' | 'random'
  const [inputData, setInputData] = useState([]);
  const [randomCount, setRandomCount] = useState(3);
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Default features for input (simplified - in real app, get from model metadata)
  const defaultFeatures = [
    { name: "age", type: "int", min: 15, max: 60 },
    { name: "hours_listened", type: "float", min: 0, max: 50 },
    { name: "days_active", type: "int", min: 1, max: 30 },
    { name: "favorite_genre", type: "int", min: 0, max: 4 },
  ];

  // Load ready models
  useEffect(() => {
    const fetchModels = async () => {
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
      }
    };
    fetchModels();
  }, []);

  const generateRandomRow = () => {
    const row = {};
    for (const feat of defaultFeatures) {
      if (feat.type === "int") {
        row[feat.name] =
          Math.floor(Math.random() * (feat.max - feat.min + 1)) + feat.min;
      } else {
        row[feat.name] =
          Math.round((Math.random() * (feat.max - feat.min) + feat.min) * 100) /
          100;
      }
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
  };

  const handleAddRow = () => {
    setInputData([...inputData, generateRandomRow()]);
  };

  const handleDeleteRow = (index) => {
    setInputData(inputData.filter((_, i) => i !== index));
  };

  const handleInputChange = (index, field, value) => {
    const newData = [...inputData];
    newData[index][field] = parseFloat(value) || 0;
    setInputData(newData);
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

  const formatPrediction = (pred) => {
    // For classification (0 or 1)
    if (pred === 1) return { value: 1, label: "Will Return", icon: "✅" };
    if (pred === 0) return { value: 0, label: "Won't Return", icon: "❌" };
    // For regression (numeric)
    return { value: pred, label: `Score: ${pred}`, icon: "📊" };
  };

  // TODO: Implement the UI based on wireframe above

  return <div>{/* Implement your UI here */}</div>;
}
```

---

# Environment Setup

Tambahkan ke `.env.local`:

```env
ML_API_URL=https://ml-powered-prediction-platform.up.railway.app
```

---

# Testing Guide

## Test Flow

1. **Health Monitor** (Surya)
   - Buka tab API Health → harus tampil status Online
   - Toggle auto-refresh → pastikan update setiap 30 detik

2. **Training Studio** (Dhika)
   - Pilih scenario → generate data → lihat preview
   - Isi model ID → klik Train → harus dapat response "queued"

3. **Model Gallery** (Omar)
   - Setelah train, refresh gallery → model baru harus muncul
   - Coba delete model → harus hilang dari list

4. **Model Status** (Lakmen)
   - Ketik model ID yang baru di-train → Check
   - Jika training, aktifkan auto-poll → tunggu sampai ready

5. **Prediction Playground** (Arqila)
   - Pilih model yang ready
   - Generate random input atau manual
   - Klik Predict → lihat hasil

---

# Contact

Jika ada pertanyaan, hubungi yang buat API (core backend).

**Files yang sudah ready:**

- `app/api/ml/health/route.js`
- `app/api/ml/models/route.js`
- `app/api/ml/models/[id]/route.js`
- `app/api/ml/training/route.js`
- `app/api/ml/predictions/[id]/route.js`
- `app/api/ml/generate-dummy/route.js`
- `app/dashboard/ml-playground/page.jsx` (skeleton dengan tabs)

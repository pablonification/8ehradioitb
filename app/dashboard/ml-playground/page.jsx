"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { hasAnyRole } from "@/lib/roleUtils";
import { FiActivity, FiCpu, FiDatabase, FiEye, FiZap } from "react-icons/fi";

// Import feature components (to be created by team members)
import HealthMonitor from "./components/HealthMonitor";
import TrainingStudio from "./components/TrainingStudio";
import ModelGallery from "./components/ModelGallery";
import ModelStatus from "./components/ModelStatus";
import PredictionPlayground from "./components/PredictionPlayground";

const TABS = [
  {
    id: "health",
    label: "API Health",
    icon: FiActivity,
    component: HealthMonitor,
  },
  {
    id: "training",
    label: "Train Model",
    icon: FiCpu,
    component: TrainingStudio,
  },
  {
    id: "models",
    label: "Model Gallery",
    icon: FiDatabase,
    component: ModelGallery,
  },
  { id: "status", label: "Model Status", icon: FiEye, component: ModelStatus },
  {
    id: "predict",
    label: "Predict",
    icon: FiZap,
    component: PredictionPlayground,
  },
];

export default function MLPlaygroundPage() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState("health");

  // Loading state
  if (status === "loading") {
    return (
      <div className="p-8 text-center font-body">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  // Authorization check - DEVELOPER only
  const isAuthorized = session && hasAnyRole(session.user.role, ["DEVELOPER"]);

  if (!isAuthorized) {
    return (
      <div className="p-8 text-center text-red-500 font-body">
        Access Denied. You do not have permission to view this page.
      </div>
    );
  }

  const ActiveComponent = TABS.find((tab) => tab.id === activeTab)?.component;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-heading font-bold text-gray-800">
          ML Playground
        </h1>
        <p className="text-gray-600 font-body mt-1">
          Train machine learning models, make predictions, and manage your ML
          pipeline.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 mb-6">
        <div className="flex flex-wrap border-b border-gray-200">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 font-body font-medium transition-colors cursor-pointer
                  ${
                    isActive
                      ? "text-red-600 border-b-2 border-red-500 bg-red-50"
                      : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                  }`}
              >
                <Icon size={18} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-6">{ActiveComponent && <ActiveComponent />}</div>
      </div>
    </div>
  );
}

"use client";

import { useSession } from "next-auth/react";
import { hasAnyRole } from "@/lib/roleUtils";
import TrainingStudio from "./components/TrainingStudio";

export default function MLPlaygroundPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="p-8 text-center font-body">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  const isAuthorized = session && hasAnyRole(session.user.role, ["DEVELOPER"]);

  if (!isAuthorized) {
    return (
      <div className="p-8 text-center text-red-500 font-body">
        Access Denied. You do not have permission to view this page.
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-heading font-bold text-gray-900">
          Integration Studio
        </h1>
        <p className="text-gray-600 font-body mt-1">
          Integrate 8EH Radio data with Predictia ML API for training and
          predictions.
        </p>
      </div>

      <TrainingStudio />
    </div>
  );
}

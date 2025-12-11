"use client";

/**
 * ModelGallery Component
 *
 * Feature 3: Model Gallery
 * Assigned to: Omar
 *
 * API Endpoints:
 * - GET /api/ml/models (list all models)
 * - DELETE /api/ml/models/[id] (delete model)
 *
 * TODO: Implement this component
 * See ML_PLAYGROUND_PLAN.md for detailed requirements
 */

export default function ModelGallery() {
  return (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">📚</div>
      <h2 className="text-xl font-heading font-bold text-gray-800 mb-2">
        Model Gallery
      </h2>
      <p className="text-gray-500 font-body">
        Assigned to: <strong>Omar</strong>
      </p>
      <p className="text-gray-400 font-body text-sm mt-2">
        Component belum diimplementasi. Lihat ML_PLAYGROUND_PLAN.md
      </p>
    </div>
  );
}

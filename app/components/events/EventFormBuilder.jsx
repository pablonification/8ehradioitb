"use client";

import { useMemo, useState } from "react";
import EventQuestionEditor from "@/app/components/events/EventQuestionEditor";

const PROFILE_FIELDS = [
  "fullName",
  "birthDate",
  "facultyMajor",
  "nim",
  "activePhone",
  "emergencyPhone",
  "emergencyContactRelation",
  "lineId",
  "originAddress",
  "itbAddress",
  "photoUrl",
  "cohortBatch",
  "division",
  "socialMedia",
];

function getSchemaFromVersion(version) {
  const schema =
    version?.formSchema && typeof version.formSchema === "object"
      ? version.formSchema
      : {};

  const requestedProfileFields = Array.isArray(version?.requestedProfileFields)
    ? version.requestedProfileFields
    : Array.isArray(schema.requestedProfileFields)
      ? schema.requestedProfileFields
      : [];

  const questions = Array.isArray(version?.questions)
    ? version.questions
    : Array.isArray(schema.questions)
      ? schema.questions
      : [];

  const consentText =
    typeof version?.consentText === "string"
      ? version.consentText
      : typeof schema.consentText === "string"
        ? schema.consentText
        : "";

  return {
    requestedProfileFields,
    questions,
    consentText,
  };
}

export default function EventFormBuilder({
  eventSlug,
  initialFormVersions = [],
}) {
  const latestVersion = useMemo(() => {
    if (
      !Array.isArray(initialFormVersions) ||
      initialFormVersions.length === 0
    ) {
      return null;
    }

    return [...initialFormVersions].sort(
      (a, b) => (b.version ?? 0) - (a.version ?? 0),
    )[0];
  }, [initialFormVersions]);

  const latestSchema = getSchemaFromVersion(latestVersion);

  const [selectedFields, setSelectedFields] = useState(
    latestSchema.requestedProfileFields,
  );
  const [questions, setQuestions] = useState(latestSchema.questions);
  const [consentText, setConsentText] = useState(latestSchema.consentText);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishedVersion, setPublishedVersion] = useState(null);
  const [error, setError] = useState(null);

  const toggleField = (fieldKey) => {
    setSelectedFields((current) =>
      current.includes(fieldKey)
        ? current.filter((key) => key !== fieldKey)
        : [...current, fieldKey],
    );
  };

  const buildPayload = () => ({
    formSchema: {
      requestedProfileFields: selectedFields,
      questions,
      consentText,
    },
    requestedProfileFields: selectedFields,
    questions,
    consentText,
  });

  const saveDraft = async () => {
    const response = await fetch(`/api/events/${eventSlug}/form-versions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildPayload()),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error || "Failed to save draft.");
    }

    return data;
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    setError(null);
    try {
      await saveDraft();
    } catch (draftError) {
      setError(draftError.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setError(null);

    if (!consentText.trim()) {
      setError("Consent text is required to publish");
      return;
    }

    setPublishing(true);
    try {
      const draft = await saveDraft();
      const publishResponse = await fetch(
        `/api/events/${eventSlug}/form-versions/${draft.id}/publish`,
        {
          method: "POST",
        },
      );

      const publishData = await publishResponse.json();
      if (!publishResponse.ok) {
        throw new Error(publishData?.error || "Failed to publish form.");
      }

      setPublishedVersion(publishData.version ?? null);
    } catch (publishError) {
      setError(publishError.message);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-3xl font-heading font-bold text-gray-800">
          Form Builder
        </h1>
        <p className="text-sm text-gray-600 mt-1">Event: {eventSlug}</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Profile Fields
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {PROFILE_FIELDS.map((fieldKey) => (
            <label
              key={fieldKey}
              className="inline-flex items-center gap-2 text-sm text-gray-700"
            >
              <input
                type="checkbox"
                data-testid={`profile-field-${fieldKey}`}
                checked={selectedFields.includes(fieldKey)}
                onChange={() => toggleField(fieldKey)}
              />
              {fieldKey}
            </label>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Custom Questions
        </h2>
        <EventQuestionEditor questions={questions} onChange={setQuestions} />
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Consent Text
        </h2>
        <textarea
          value={consentText}
          onChange={(event) => setConsentText(event.target.value)}
          rows={6}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
          placeholder="I consent to the collection and processing of my data for this event registration."
        />
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={saving || publishing}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Draft"}
          </button>

          <button
            type="button"
            data-testid="publish-form-button"
            onClick={handlePublish}
            disabled={publishing || saving}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 disabled:opacity-60"
          >
            {publishing ? "Publishing..." : "Publish"}
          </button>

          {publishedVersion ? (
            <span
              data-testid="published-version-badge"
              className="inline-flex items-center bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium"
            >
              v{publishedVersion}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

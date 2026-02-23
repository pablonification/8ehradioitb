"use client";

import { useMemo, useState } from "react";

function isFilledValue(value) {
  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (typeof value === "boolean") {
    return value;
  }

  return value !== null && value !== undefined && String(value).trim() !== "";
}

function normalizeOptions(options) {
  if (Array.isArray(options)) {
    return options.filter((option) => typeof option === "string");
  }

  if (typeof options === "string") {
    return options
      .split(",")
      .map((option) => option.trim())
      .filter(Boolean);
  }

  return [];
}

function getFieldType(field) {
  if (!field || typeof field !== "object") {
    return "text";
  }

  return typeof field.fieldType === "string" ? field.fieldType : "text";
}

function getRequired(field) {
  return Boolean(field?.isRequired || field?.required);
}

function InputField({ field, value, onChange }) {
  const fieldType = getFieldType(field);
  const options = normalizeOptions(field?.options);
  const commonClassName =
    "mt-3 block w-full rounded-md border border-gray-300 bg-white px-3 py-3 text-gray-900 font-body text-base focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200";

  if (fieldType === "textarea") {
    return (
      <textarea
        rows={5}
        value={typeof value === "string" ? value : ""}
        onChange={(event) => onChange(event.target.value)}
        className={commonClassName}
      />
    );
  }

  if (fieldType === "select") {
    return (
      <select
        value={typeof value === "string" ? value : ""}
        onChange={(event) => onChange(event.target.value)}
        className={commonClassName}
      >
        <option value="">Select an option</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  if (fieldType === "checkbox" && options.length > 0) {
    const selectedOptions = Array.isArray(value) ? value : [];

    return (
      <div className="mt-3 space-y-2">
        {options.map((option) => {
          const checked = selectedOptions.includes(option);
          return (
            <label
              key={option}
              className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={(event) => {
                  if (event.target.checked) {
                    onChange([...selectedOptions, option]);
                    return;
                  }

                  onChange(selectedOptions.filter((item) => item !== option));
                }}
              />
              <span>{option}</span>
            </label>
          );
        })}
      </div>
    );
  }

  if (fieldType === "checkbox") {
    return (
      <label className="mt-4 flex items-center gap-2 text-sm text-gray-700 font-body">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span>Yes</span>
      </label>
    );
  }

  const htmlInputType =
    fieldType === "number"
      ? "number"
      : fieldType === "date"
        ? "date"
        : fieldType === "email"
          ? "email"
          : fieldType === "url"
            ? "url"
            : fieldType === "phone"
              ? "tel"
              : "text";

  return (
    <input
      type={htmlInputType}
      value={typeof value === "string" ? value : ""}
      onChange={(event) => onChange(event.target.value)}
      className={commonClassName}
    />
  );
}

export default function ParticipantFlow({
  eventSlug,
  eventTitle,
  requestedProfileFields = [],
  missingProfileFields = [],
  questions = [],
  consentText,
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [profileValues, setProfileValues] = useState({});
  const [questionValues, setQuestionValues] = useState({});
  const [consentGranted, setConsentGranted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionId, setSubmissionId] = useState("");

  const steps = useMemo(() => {
    const profileSteps = missingProfileFields.map((field) => ({
      type: "profile",
      key: field.key,
      field,
    }));
    const questionSteps = questions
      .filter((question) => question && typeof question === "object")
      .map((question, index) => ({
        type: "question",
        key: question.key || `question-${index}`,
        field: question,
      }));

    return [
      { type: "notice", key: "notice" },
      ...profileSteps,
      ...questionSteps,
      { type: "consent", key: "consent" },
    ];
  }, [missingProfileFields, questions]);

  const activeStep = steps[currentStep];
  const totalSteps = steps.length;
  const progress = Math.round(((currentStep + 1) / totalSteps) * 100);

  const requestedLabels = requestedProfileFields
    .map((field) => field?.label || field?.key)
    .filter(Boolean);

  const validateCurrentStep = () => {
    if (!activeStep) {
      return true;
    }

    if (activeStep.type === "notice") {
      return true;
    }

    if (activeStep.type === "consent") {
      if (!consentGranted) {
        setErrorMessage("You must provide consent before submitting.");
        return false;
      }
      return true;
    }

    const field = activeStep.field;
    const required = getRequired(field);
    if (!required) {
      return true;
    }

    const source =
      activeStep.type === "profile" ? profileValues : questionValues;
    const value = source[activeStep.key];

    if (!isFilledValue(value)) {
      const label = field?.label || "This field";
      setErrorMessage(`${label} is required.`);
      return false;
    }

    return true;
  };

  const goNext = () => {
    setErrorMessage("");
    if (!validateCurrentStep()) {
      return;
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep((step) => step + 1);
    }
  };

  const goBack = () => {
    setErrorMessage("");
    if (currentStep > 0) {
      setCurrentStep((step) => step - 1);
    }
  };

  const buildMissingProfilePayload = () => {
    const payload = {};
    missingProfileFields.forEach((field) => {
      const key = field?.key;
      if (!key) {
        return;
      }

      const value = profileValues[key];
      if (isFilledValue(value) || typeof value === "boolean") {
        payload[key] = value;
      }
    });

    return payload;
  };

  const buildQuestionPayload = () => {
    const payload = {};
    Object.entries(questionValues).forEach(([key, value]) => {
      if (isFilledValue(value) || typeof value === "boolean") {
        payload[key] = value;
      }
    });

    return payload;
  };

  const handleSubmit = async () => {
    setErrorMessage("");
    setSubmitError("");

    if (!validateCurrentStep()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/events/${eventSlug}/registrations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          missingProfileFields: buildMissingProfilePayload(),
          answers: buildQuestionPayload(),
          consent: { granted: true },
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (payload?.error === "already_submitted") {
          throw new Error("You have already submitted this registration.");
        }

        if (payload?.error === "consent_required") {
          throw new Error("Consent is required to submit this form.");
        }

        throw new Error(payload?.error || "Failed to submit registration.");
      }

      setSubmissionId(payload?.id || "");
    } catch (error) {
      setSubmitError(error?.message || "Failed to submit registration.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submissionId) {
    return (
      <section className="mx-auto w-full max-w-3xl rounded-xl border border-green-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="font-body text-sm font-semibold uppercase tracking-wide text-green-700">
          Registration submitted
        </p>
        <h1 className="mt-2 font-heading text-3xl font-bold text-gray-900">
          You are all set.
        </h1>
        <p className="mt-3 font-body text-sm text-gray-700">
          Your submission has been recorded for {eventTitle}.
        </p>
        <p className="mt-4 rounded-md bg-green-50 px-4 py-3 font-mono text-sm text-green-800">
          Submission ID: {submissionId}
        </p>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-3xl space-y-5">
      <header className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <p className="font-body text-sm text-gray-600">Event registration</p>
        <h1 className="mt-1 font-heading text-2xl font-bold text-gray-900 sm:text-3xl">
          {eventTitle}
        </h1>
        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between font-body text-xs text-gray-600">
            <span>
              Step {currentStep + 1} of {totalSteps}
            </span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-red-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </header>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="min-h-[220px] transition-all duration-200 ease-out">
          {activeStep?.type === "notice" ? (
            <div>
              <p className="font-body text-xs font-semibold uppercase tracking-wide text-red-600">
                Requested data notice
              </p>
              <h2 className="mt-2 font-heading text-2xl font-bold text-gray-900">
                We will request profile data before registration.
              </h2>
              <p className="mt-3 font-body text-sm leading-6 text-gray-700">
                This event asks for selected participant profile fields. We only
                ask for fields that are still missing in your profile.
              </p>

              {requestedLabels.length > 0 ? (
                <div className="mt-4 rounded-md border border-red-100 bg-red-50 p-4">
                  <p className="font-body text-xs font-semibold uppercase tracking-wide text-red-700">
                    Requested profile fields
                  </p>
                  <ul className="mt-2 grid grid-cols-1 gap-2 font-body text-sm text-red-900 sm:grid-cols-2">
                    {requestedLabels.map((label) => (
                      <li key={label} className="rounded bg-white px-3 py-2">
                        {label}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="mt-4 font-body text-sm text-gray-700">
                  This event does not request additional profile fields.
                </p>
              )}

              {missingProfileFields.length > 0 ? (
                <p className="mt-4 font-body text-sm text-gray-700">
                  We detected {missingProfileFields.length} missing profile
                  field
                  {missingProfileFields.length > 1 ? "s" : ""} to complete.
                </p>
              ) : (
                <p className="mt-4 font-body text-sm text-gray-700">
                  Your requested profile data is already complete. You can
                  continue to event questions.
                </p>
              )}
            </div>
          ) : null}

          {(activeStep?.type === "profile" ||
            activeStep?.type === "question") &&
          activeStep?.field ? (
            <div>
              <p className="font-body text-xs font-semibold uppercase tracking-wide text-gray-500">
                {activeStep.type === "profile"
                  ? "Missing profile field"
                  : "Event question"}
              </p>
              <h2 className="mt-2 font-heading text-2xl font-bold text-gray-900">
                {activeStep.field.label || activeStep.key}
              </h2>
              {getRequired(activeStep.field) ? (
                <p className="mt-2 font-body text-xs text-red-600">Required</p>
              ) : (
                <p className="mt-2 font-body text-xs text-gray-500">Optional</p>
              )}

              <InputField
                field={activeStep.field}
                value={
                  activeStep.type === "profile"
                    ? profileValues[activeStep.key]
                    : questionValues[activeStep.key]
                }
                onChange={(value) => {
                  if (activeStep.type === "profile") {
                    setProfileValues((current) => ({
                      ...current,
                      [activeStep.key]: value,
                    }));
                    return;
                  }

                  setQuestionValues((current) => ({
                    ...current,
                    [activeStep.key]: value,
                  }));
                }}
              />
            </div>
          ) : null}

          {activeStep?.type === "consent" ? (
            <div>
              <p className="font-body text-xs font-semibold uppercase tracking-wide text-gray-500">
                Final step
              </p>
              <h2 className="mt-2 font-heading text-2xl font-bold text-gray-900">
                Confirm and submit registration
              </h2>

              <div className="mt-4 rounded-md border border-gray-200 bg-gray-50 p-4">
                <p className="whitespace-pre-wrap font-body text-sm leading-6 text-gray-700">
                  {consentText ||
                    "I consent to the collection and processing of my data for this event registration."}
                </p>
              </div>

              <label className="mt-4 flex items-start gap-2 font-body text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={consentGranted}
                  onChange={(event) => setConsentGranted(event.target.checked)}
                  className="mt-0.5"
                />
                <span>
                  I agree and give explicit consent to submit this registration.
                </span>
              </label>

              {submitError ? (
                <p className="mt-3 font-body text-sm text-red-600">
                  {submitError}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        {errorMessage ? (
          <p className="mt-4 font-body text-sm text-red-600">{errorMessage}</p>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={goBack}
            disabled={currentStep === 0 || isSubmitting}
            className="rounded-md border border-gray-300 px-4 py-2 font-body text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Back
          </button>

          {activeStep?.type === "consent" ? (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="rounded-md bg-red-500 px-5 py-2 font-body text-sm font-semibold text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Submitting..." : "Submit registration"}
            </button>
          ) : (
            <button
              type="button"
              onClick={goNext}
              disabled={isSubmitting}
              className="rounded-md bg-red-500 px-5 py-2 font-body text-sm font-semibold text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Continue
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

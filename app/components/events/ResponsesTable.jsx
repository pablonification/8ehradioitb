"use client";

import { Fragment, useMemo, useState } from "react";

function normalizeObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value;
}

function formatCellValue(value) {
  if (Array.isArray(value)) {
    return value.join(", ");
  }

  if (value === null || value === undefined) {
    return "-";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

function buildSearchText(submission) {
  const profileSnapshot = normalizeObject(submission.profileSnapshot);
  const answers = normalizeObject(submission.answers);

  return [
    submission.id,
    submission.status,
    submission.submitter?.name,
    submission.submitter?.email,
    JSON.stringify(profileSnapshot),
    JSON.stringify(answers),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function renderKeyValueRows(data, emptyMessage) {
  const entries = Object.entries(normalizeObject(data));

  if (entries.length === 0) {
    return <p className="text-sm text-gray-600">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-2">
      {entries.map(([key, value]) => (
        <div
          key={key}
          className="rounded-md border border-gray-200 bg-white px-3 py-2"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {key}
          </p>
          <p className="mt-1 text-sm text-gray-800 break-words">
            {formatCellValue(value)}
          </p>
        </div>
      ))}
    </div>
  );
}

export default function ResponsesTable({ eventSlug, submissions = [] }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedSubmissionId, setExpandedSubmissionId] = useState("");
  const [exportStatus, setExportStatus] = useState("");

  const availableStatuses = useMemo(() => {
    const values = new Set();
    submissions.forEach((submission) => {
      if (submission.status) {
        values.add(submission.status);
      }
    });
    return ["all", ...Array.from(values)];
  }, [submissions]);

  const filteredSubmissions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return submissions.filter((submission) => {
      if (statusFilter !== "all" && submission.status !== statusFilter) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return buildSearchText(submission).includes(normalizedQuery);
    });
  }, [query, statusFilter, submissions]);

  const triggerExport = (format) => {
    const upperFormat = format.toUpperCase();
    setExportStatus(`Starting ${upperFormat} export...`);
    const exportUrl = `/api/events/${eventSlug}/exports/${format}`;
    window.open(exportUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => triggerExport("csv")}
            className="bg-red-500 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-red-600"
          >
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => triggerExport("xlsx")}
            className="bg-red-500 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-red-600"
          >
            Export XLSX
          </button>
          <button
            type="button"
            onClick={() => triggerExport("sheets")}
            className="bg-red-500 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-red-600"
          >
            Export Google Sheets
          </button>
        </div>

        {exportStatus ? (
          <p
            className="text-sm text-gray-700"
            data-testid="responses-export-status"
          >
            {exportStatus}
          </p>
        ) : null}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search submitter, snapshot, or answers"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-400"
          >
            {availableStatuses.map((statusValue) => (
              <option key={statusValue} value={statusValue}>
                {statusValue === "all" ? "All statuses" : statusValue}
              </option>
            ))}
          </select>
        </div>

        {filteredSubmissions.length === 0 ? (
          <p className="text-sm text-gray-600">
            No submissions match your filters.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full leading-normal">
              <thead>
                <tr>
                  <th className="px-4 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-4 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Submitter
                  </th>
                  <th className="px-4 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Snapshot fields
                  </th>
                  <th className="px-4 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Answers
                  </th>
                  <th className="px-4 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredSubmissions.map((submission) => {
                  const snapshotEntries = Object.entries(
                    normalizeObject(submission.profileSnapshot),
                  );
                  const answerEntries = Object.entries(
                    normalizeObject(submission.answers),
                  );
                  const isExpanded = expandedSubmissionId === submission.id;

                  return (
                    <Fragment key={submission.id}>
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 border-b border-gray-200 text-sm text-gray-700 align-top whitespace-nowrap">
                          {new Date(submission.submittedAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 border-b border-gray-200 text-sm text-gray-700 align-top">
                          <p className="font-medium text-gray-900">
                            {submission.submitter?.name || "Unknown user"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {submission.submitter?.email ||
                              submission.submitter?.id ||
                              "-"}
                          </p>
                        </td>
                        <td className="px-4 py-3 border-b border-gray-200 text-sm text-gray-700 align-top">
                          <span className="capitalize">
                            {submission.status || "submitted"}
                          </span>
                        </td>
                        <td className="px-4 py-3 border-b border-gray-200 text-sm text-gray-700 align-top">
                          {snapshotEntries.length === 0 ? (
                            <span className="text-gray-500">
                              No snapshot data
                            </span>
                          ) : (
                            <div className="space-y-1">
                              {snapshotEntries
                                .slice(0, 2)
                                .map(([key, value]) => (
                                  <p
                                    key={key}
                                    className="text-xs text-gray-700 break-words"
                                  >
                                    <span className="font-semibold">
                                      {key}:
                                    </span>{" "}
                                    {formatCellValue(value)}
                                  </p>
                                ))}
                              {snapshotEntries.length > 2 ? (
                                <p className="text-xs text-gray-500">
                                  +{snapshotEntries.length - 2} more
                                </p>
                              ) : null}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 border-b border-gray-200 text-sm text-gray-700 align-top">
                          {answerEntries.length} answer
                          {answerEntries.length === 1 ? "" : "s"}
                        </td>
                        <td className="px-4 py-3 border-b border-gray-200 text-sm text-gray-700 align-top">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedSubmissionId((current) =>
                                current === submission.id ? "" : submission.id,
                              )
                            }
                            className="text-red-600 hover:text-red-700 font-medium"
                          >
                            {isExpanded ? "Hide" : "View"}
                          </button>
                        </td>
                      </tr>

                      {isExpanded ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-4 py-4 border-b border-gray-200 bg-gray-50"
                          >
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              <div className="rounded-lg border border-gray-200 bg-white p-4">
                                <h3 className="text-sm font-semibold text-gray-800 mb-3">
                                  Consented profile snapshot
                                </h3>
                                {renderKeyValueRows(
                                  submission.profileSnapshot,
                                  "No consented profile snapshot data.",
                                )}
                              </div>

                              <div className="rounded-lg border border-gray-200 bg-white p-4">
                                <h3 className="text-sm font-semibold text-gray-800 mb-3">
                                  Event answers
                                </h3>
                                {renderKeyValueRows(
                                  submission.answers,
                                  "No answers submitted.",
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

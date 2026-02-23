"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { hasAnyRole } from "@/lib/roleUtils";

function makeSlug(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export default function NewEventPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const authorized = useMemo(
    () => hasAnyRole(session?.user?.role, ["DEVELOPER"]),
    [session?.user?.role],
  );

  if (status === "loading") {
    return <div className="text-sm text-gray-600">Loading...</div>;
  }

  if (!authorized) {
    return <div data-testid="events-builder-access-denied">Access denied</div>;
  }

  const handleTitleChange = (value) => {
    setTitle(value);
    if (!slugEdited) {
      setSlug(makeSlug(value));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const normalizedTitle = title.trim();
    const normalizedSlug = slug.trim();

    if (!normalizedTitle || !normalizedSlug) {
      setError("Title and slug are required.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: normalizedTitle,
          slug: normalizedSlug,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data?.error || "Failed to create event.");
        return;
      }

      router.push(`/dashboard/events/${data.slug || normalizedSlug}`);
      router.refresh();
    } catch {
      setError("Failed to create event.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold text-gray-800">
          Create Event
        </h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              className="text-sm font-medium text-gray-700"
              htmlFor="event-title"
            >
              Title
            </label>
            <input
              id="event-title"
              data-testid="event-title-input"
              type="text"
              value={title}
              onChange={(event) => handleTitleChange(event.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
              placeholder="Open House 2026"
            />
          </div>

          <div>
            <label
              className="text-sm font-medium text-gray-700"
              htmlFor="event-slug"
            >
              Slug
            </label>
            <input
              id="event-slug"
              data-testid="event-slug-input"
              type="text"
              value={slug}
              onChange={(event) => {
                setSlugEdited(true);
                setSlug(makeSlug(event.target.value));
              }}
              className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
              placeholder="open-house-2026"
            />
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={submitting}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 disabled:opacity-60"
          >
            {submitting ? "Creating..." : "Create Event"}
          </button>
        </form>
      </div>
    </div>
  );
}

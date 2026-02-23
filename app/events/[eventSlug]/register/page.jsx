import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import ParticipantFlow from "@/app/components/events/ParticipantFlow";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

async function buildOrigin() {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") || headerStore.get("host");
  const protocol = headerStore.get("x-forwarded-proto") || "http";

  if (!host) {
    return process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "";
  }

  return `${protocol}://${host}`;
}

async function getParticipantFormData(eventSlug) {
  const origin = await buildOrigin();
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();
  const endpoint = `${origin}/api/events/${eventSlug}/form`;
  const response = await fetch(endpoint, {
    method: "GET",
    headers: cookieHeader
      ? {
          cookie: cookieHeader,
        }
      : undefined,
    cache: "no-store",
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    return {
      ok: false,
      payload,
      status: response.status,
    };
  }

  return {
    ok: true,
    payload,
    status: response.status,
  };
}

function toFieldMap(fields) {
  if (!Array.isArray(fields)) {
    return new Map();
  }

  return new Map(
    fields
      .filter((field) => field && typeof field === "object")
      .map((field) => [field.key, field]),
  );
}

export default async function EventRegisterPage({ params }) {
  const { eventSlug } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=/events/${eventSlug}/register`);
  }

  const formResult = await getParticipantFormData(eventSlug);

  if (!formResult.ok) {
    const errorCode = formResult?.payload?.error || "failed_to_load_form";
    return (
      <main className="min-h-screen bg-gray-100 px-4 py-10 sm:px-6 md:px-8">
        <div className="mx-auto w-full max-w-3xl rounded-xl border border-red-200 bg-white p-6 shadow-sm">
          <h1 className="font-heading text-2xl font-bold text-gray-900">
            Registration unavailable
          </h1>
          <p className="mt-3 font-body text-sm text-gray-700">
            We could not load this registration form right now.
          </p>
          <p className="mt-1 font-body text-xs text-gray-500">
            Error: {errorCode}
          </p>
        </div>
      </main>
    );
  }

  const payload = formResult.payload || {};
  const requestedProfileFields = Array.isArray(payload.requestedProfileFields)
    ? payload.requestedProfileFields
    : [];
  const missingFieldKeys = Array.isArray(payload.missingProfileFields)
    ? payload.missingProfileFields
    : [];
  const requestedFieldMap = toFieldMap(requestedProfileFields);
  const missingProfileFields = missingFieldKeys
    .map((key) => requestedFieldMap.get(key))
    .filter(Boolean);
  const questions = Array.isArray(payload.questions) ? payload.questions : [];

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-10 sm:px-6 md:px-8">
      <ParticipantFlow
        eventSlug={eventSlug}
        eventTitle={payload?.event?.title || "Event Registration"}
        requestedProfileFields={requestedProfileFields}
        missingProfileFields={missingProfileFields}
        questions={questions}
        consentText={payload?.consentText || ""}
      />
    </main>
  );
}

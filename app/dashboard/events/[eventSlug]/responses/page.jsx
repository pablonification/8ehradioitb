import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import ResponsesTable from "@/app/components/events/ResponsesTable";
import { EVENT_ACTIONS, canPerformEventAction } from "@/lib/events/auth";
import { prisma } from "@/lib/prisma";

function normalizeObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value;
}

function pickConsentedProfileSnapshot(submission) {
  const schema = normalizeObject(submission.formSchemaSnapshot);
  const requestedFields = Array.isArray(schema.requestedProfileFields)
    ? schema.requestedProfileFields.filter((field) => typeof field === "string")
    : [];

  const rawSnapshot = normalizeObject(submission.consentedProfileSnapshot);

  if (requestedFields.length === 0) {
    return {};
  }

  return requestedFields.reduce((result, key) => {
    if (Object.prototype.hasOwnProperty.call(rawSnapshot, key)) {
      result[key] = rawSnapshot[key];
    }
    return result;
  }, {});
}

function toDashboardSubmission(submission) {
  return {
    id: submission.id,
    submittedAt: submission.submittedAt,
    status: submission.status,
    consentVersion: submission.consentVersion,
    submitter: submission.submitterUser
      ? {
          id: submission.submitterUser.id,
          name: submission.submitterUser.name,
          email: submission.submitterUser.email,
        }
      : null,
    profileSnapshot: pickConsentedProfileSnapshot(submission),
    answers: normalizeObject(submission.answers),
  };
}

export default async function EventResponsesPage({ params }) {
  const { eventSlug } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return <div data-testid="events-builder-access-denied">Access denied</div>;
  }

  const event = await prisma.event.findUnique({
    where: {
      slug: eventSlug,
    },
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
    },
  });

  if (!event) {
    notFound();
  }

  const authResult = await canPerformEventAction(
    session.user.id,
    event.id,
    EVENT_ACTIONS.SUBMISSION_READ,
  );

  if (!authResult.allowed) {
    return <div data-testid="events-builder-access-denied">Access denied</div>;
  }

  const [submissions, exportLogs] = await Promise.all([
    prisma.eventSubmission.findMany({
      where: {
        eventId: event.id,
      },
      orderBy: {
        submittedAt: "desc",
      },
      select: {
        id: true,
        status: true,
        answers: true,
        consentVersion: true,
        consentedProfileSnapshot: true,
        formSchemaSnapshot: true,
        submittedAt: true,
        submitterUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    }),
    prisma.eventExportLog.findMany({
      where: {
        eventId: event.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
      select: {
        id: true,
        exportType: true,
        rowCount: true,
        fileUrl: true,
        createdAt: true,
        requestedBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    }),
  ]);

  const safeSubmissions = submissions.map(toDashboardSubmission);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-gray-800">
            Responses Dashboard
          </h1>
          <p className="text-sm text-gray-600 mt-1">Event: {event.title}</p>
          <p className="text-sm text-gray-600">Slug: {event.slug}</p>
          <p className="text-sm text-gray-600 capitalize">
            Status: {event.status}
          </p>
        </div>
        <Link
          href={`/dashboard/events/${event.slug}`}
          className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
        >
          Back to Event
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Submissions
        </h2>
        <ResponsesTable eventSlug={event.slug} submissions={safeSubmissions} />
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Recent Exports
        </h2>
        {exportLogs.length === 0 ? (
          <p className="text-sm text-gray-600">No export logs yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full leading-normal">
              <thead>
                <tr>
                  <th className="px-4 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-4 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Requested by
                  </th>
                  <th className="px-4 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Rows
                  </th>
                  <th className="px-4 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    File
                  </th>
                </tr>
              </thead>
              <tbody>
                {exportLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 border-b border-gray-200 text-sm text-gray-700 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 border-b border-gray-200 text-sm text-gray-700 uppercase">
                      {log.exportType}
                    </td>
                    <td className="px-4 py-3 border-b border-gray-200 text-sm text-gray-700">
                      {log.requestedBy?.name ||
                        log.requestedBy?.email ||
                        "Unknown"}
                    </td>
                    <td className="px-4 py-3 border-b border-gray-200 text-sm text-gray-700">
                      {typeof log.rowCount === "number" ? log.rowCount : "-"}
                    </td>
                    <td className="px-4 py-3 border-b border-gray-200 text-sm text-gray-700">
                      {log.fileUrl ? (
                        <a
                          href={log.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-red-600 hover:text-red-700"
                        >
                          Open file
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

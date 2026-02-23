import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { hasAnyRole } from "@/lib/roleUtils";
import { prisma } from "@/lib/prisma";

export default async function EventDetailPage({ params }) {
  const { eventSlug } = await params;
  const session = await getServerSession(authOptions);

  if (!hasAnyRole(session?.user?.role, ["DEVELOPER"])) {
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

  const formVersions = await prisma.eventFormVersion.findMany({
    where: {
      eventId: event.id,
    },
    orderBy: {
      version: "desc",
    },
    select: {
      id: true,
      version: true,
      status: true,
      publishedAt: true,
      createdAt: true,
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-gray-800">
            {event.title}
          </h1>
          <p className="text-sm text-gray-600 mt-1">Slug: {event.slug}</p>
          <p className="text-sm text-gray-600 capitalize">
            Status: {event.status}
          </p>
        </div>
        <Link
          href={`/dashboard/events/${event.slug}/form-builder`}
          className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
        >
          Form Builder
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Form Versions
        </h2>

        {formVersions.length === 0 ? (
          <p className="text-sm text-gray-600">No form versions yet.</p>
        ) : (
          <div className="space-y-3">
            {formVersions.map((version) => (
              <div
                key={version.id}
                className="border border-gray-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    v{version.version}
                  </p>
                  <p className="text-xs text-gray-500">
                    Created {new Date(version.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-sm text-gray-700 capitalize">
                  {version.status}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

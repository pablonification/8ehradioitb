import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { hasAnyRole } from "@/lib/roleUtils";
import { prisma } from "@/lib/prisma";

export default async function EventsPage() {
  const session = await getServerSession(authOptions);

  if (!hasAnyRole(session?.user?.role, ["DEVELOPER"])) {
    return <div data-testid="events-builder-access-denied">Access denied</div>;
  }

  const events = await prisma.event.findMany({
    where: {
      organizers: {
        some: {
          userId: session.user.id,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      createdAt: true,
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-heading font-bold text-gray-800">
          Events
        </h1>
        <Link
          href="/dashboard/events/new"
          className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
        >
          New Event
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        {events.length === 0 ? (
          <div className="text-sm text-gray-600">
            No events found. Create your first event.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full leading-normal">
              <thead>
                <tr>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Slug
                  </th>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4 border-b border-gray-200 text-sm">
                      <Link
                        href={`/dashboard/events/${event.slug}`}
                        className="text-gray-900 font-semibold hover:text-red-600"
                      >
                        {event.title}
                      </Link>
                    </td>
                    <td className="px-5 py-4 border-b border-gray-200 text-sm text-gray-700">
                      {event.slug}
                    </td>
                    <td className="px-5 py-4 border-b border-gray-200 text-sm text-gray-700 capitalize">
                      {event.status}
                    </td>
                    <td className="px-5 py-4 border-b border-gray-200 text-sm text-gray-700">
                      {new Date(event.createdAt).toLocaleDateString()}
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

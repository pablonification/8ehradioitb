import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { hasAnyRole } from "@/lib/roleUtils";
import { prisma } from "@/lib/prisma";
import EventFormBuilder from "@/app/components/events/EventFormBuilder";

export default async function EventFormBuilderPage({ params }) {
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
    },
  });

  if (!event) {
    return <div className="text-sm text-gray-600">Event not found.</div>;
  }

  const initialFormVersions = await prisma.eventFormVersion.findMany({
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
      formSchema: true,
      consentText: true,
    },
  });

  return (
    <EventFormBuilder
      eventSlug={eventSlug}
      initialFormVersions={initialFormVersions}
    />
  );
}

import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import {
  EVENT_ACTIONS,
  assertEventAction,
  requireSession,
} from "@/lib/events/auth";
import { normalizeFormSchema } from "@/lib/forms/schema";
import { flattenSubmissionRows } from "@/lib/forms/submission";
import { reportCriticalError } from "@/lib/observability/critical";
import { resolveR2DownloadUrl } from "@/lib/storage/r2";

export async function POST(req, { params }) {
  try {
    const session = await requireSession(req);

    const event = await prisma.event.findUnique({
      where: {
        slug: params.eventSlug,
      },
      select: {
        id: true,
        slug: true,
        title: true,
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const authResponse = await assertEventAction(
      session.user.id,
      event.id,
      EVENT_ACTIONS.EXPORT_RUN,
    );

    if (authResponse) {
      return authResponse;
    }

    const latestPublished = await prisma.eventFormVersion.findFirst({
      where: {
        eventId: event.id,
        status: "published",
      },
      orderBy: {
        version: "desc",
      },
      select: {
        id: true,
        formSchema: true,
      },
    });

    if (!latestPublished) {
      return NextResponse.json(
        { error: "No published form version" },
        { status: 404 },
      );
    }

    const schema = normalizeFormSchema(latestPublished.formSchema);

    const [requestedFields, submissions] = await Promise.all([
      schema.requestedProfileFields.length
        ? prisma.profileFieldCatalog.findMany({
            where: {
              key: {
                in: schema.requestedProfileFields,
              },
            },
            select: {
              key: true,
              label: true,
              fieldType: true,
            },
          })
        : Promise.resolve([]),
      prisma.eventSubmission.findMany({
        where: {
          eventId: event.id,
        },
        orderBy: {
          submittedAt: "asc",
        },
      }),
    ]);

    const rows = await flattenSubmissionRows({
      submissions,
      requestedFields,
      questions: schema.questions,
      sections: schema.sections,
      buildFileUrl: (key) => resolveR2DownloadUrl(key, { forceDownload: true }),
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Responses");
    const xlsxBuffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    await prisma.eventExportLog.create({
      data: {
        eventId: event.id,
        requestedById: session.user.id,
        exportType: "xlsx",
        rowCount: rows.length,
      },
    });

    return new NextResponse(xlsxBuffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${event.slug}-responses.xlsx"`,
      },
    });
  } catch (error) {
    if (error?.status) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    await reportCriticalError({
      source: "api/events/export/xlsx",
      message: "Failed to export submissions to XLSX",
      error,
      context: { eventSlug: params?.eventSlug || "" },
    });
    return NextResponse.json(
      { error: "internal_server_error" },
      { status: 500 },
    );
  }
}

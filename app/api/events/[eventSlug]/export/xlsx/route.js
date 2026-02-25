import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { prisma } from "@/lib/prisma";
import {
  EVENT_ACTIONS,
  assertEventAction,
  requireSession,
} from "@/lib/events/auth";
import { normalizeFormSchema } from "@/lib/forms/schema";
import { flattenSubmissionRows } from "@/lib/forms/submission";

const R2_ENDPOINT = process.env.R2_ENDPOINT;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET = process.env.R2_BUCKET;
const R2_PUBLIC_DEV_URL = process.env.R2_PUBLIC_DEV_URL;

const s3 =
  R2_ENDPOINT && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET
    ? new S3Client({
        region: "auto",
        endpoint: R2_ENDPOINT,
        credentials: {
          accessKeyId: R2_ACCESS_KEY_ID,
          secretAccessKey: R2_SECRET_ACCESS_KEY,
        },
      })
    : null;

async function buildFileUrl(key) {
  if (!key || typeof key !== "string") return "";

  if (/^https?:\/\//i.test(key)) {
    return key;
  }

  if (s3) {
    try {
      return await getSignedUrl(
        s3,
        new GetObjectCommand({
          Bucket: R2_BUCKET,
          Key: key,
        }),
        { expiresIn: 3600 },
      );
    } catch (error) {
      console.warn("Failed to sign file URL, falling back to public URL", error);
    }
  }

  if (R2_PUBLIC_DEV_URL) {
    return `${R2_PUBLIC_DEV_URL}/${key}`;
  }

  return key;
}

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

    const rows = [];
    for (const row of flattenSubmissionRows({
      submissions,
      requestedFields,
      questions: schema.questions,
      buildFileUrl,
    })) {
      rows.push(row);
    }

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

    console.error("Failed to export submissions to XLSX:", error);
    return NextResponse.json(
      { error: "internal_server_error" },
      { status: 500 },
    );
  }
}

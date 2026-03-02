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

async function getGoogleAccessToken(userId) {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "google" },
    select: {
      access_token: true,
      refresh_token: true,
      expires_at: true,
    },
  });

  if (!account) return { error: "no_google_account" };


  const now = Math.floor(Date.now() / 1000);

  // Token still valid (60s buffer)
  if (account.expires_at && account.expires_at - 60 > now) {
    return { accessToken: account.access_token };
  }

  // Need to refresh
  if (!account.refresh_token) return { error: "no_refresh_token" };

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: account.refresh_token,
    }),
  });

  if (!res.ok) return { error: "token_refresh_failed" };

  const tokens = await res.json();
  const refreshedAccessToken =
    typeof tokens?.access_token === "string" ? tokens.access_token.trim() : "";
  const expiresInSeconds = Number(tokens?.expires_in);

  if (!refreshedAccessToken || !Number.isFinite(expiresInSeconds) || expiresInSeconds <= 0) {
    return { error: "token_refresh_failed" };
  }

  await prisma.account.updateMany({
    where: { userId, provider: "google" },
    data: {
      access_token: refreshedAccessToken,
      expires_at: Math.floor(Date.now() / 1000) + Math.floor(expiresInSeconds),
      ...(tokens.refresh_token && { refresh_token: tokens.refresh_token }),
    },
  });

  return { accessToken: refreshedAccessToken };
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

    // Retrieve and validate Google access token
    const tokenResult = await getGoogleAccessToken(session.user.id);

    if (tokenResult.error) {
      return NextResponse.json(
        { error: tokenResult.error },
        { status: tokenResult.error === "drive_not_authorized" ? 403 : 500 },
      );
    }

    const { accessToken } = tokenResult;

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
      buildFileUrl: (key) => resolveR2DownloadUrl(key, { forceDownload: true }),
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Responses");
    const xlsxBuffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    // Upload to Google Drive, converting to Google Sheets on the fly
    const fileName = `${event.title || event.slug} - Responses`;
    const boundary = `boundary_${Date.now()}`;
    const metadata = JSON.stringify({
      name: fileName,
      mimeType: "application/vnd.google-apps.spreadsheet",
    });

    const body = Buffer.concat([
      Buffer.from(
        `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n`,
      ),
      Buffer.from(
        `--${boundary}\r\nContent-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet\r\n\r\n`,
      ),
      xlsxBuffer,
      Buffer.from(`\r\n--${boundary}--`),
    ]);

    const driveRes = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": `multipart/related; boundary="${boundary}"`,
        },
        body,
      },
    );

    if (!driveRes.ok) {
      if (driveRes.status === 401 || driveRes.status === 403) {
        return NextResponse.json(
          { error: "drive_not_authorized" },
          { status: 403 },
        );
      }
      const driveErrorText = await driveRes.text();
      await reportCriticalError({
        source: "api/events/export/drive",
        message: "Drive upload failed",
        context: {
          eventSlug: params?.eventSlug || "",
          status: driveRes.status,
          body: driveErrorText,
        },
      });
      return NextResponse.json(
        { error: "drive_upload_failed" },
        { status: 500 },
      );
    }

    const file = await driveRes.json();

    await prisma.eventExportLog.create({
      data: {
        eventId: event.id,
        requestedById: session.user.id,
        exportType: "drive",
        rowCount: rows.length,
      },
    });

    return NextResponse.json({ url: file.webViewLink });
  } catch (error) {
    if (error?.status) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    await reportCriticalError({
      source: "api/events/export/drive",
      message: "Failed to export submissions to Drive",
      error,
      context: { eventSlug: params?.eventSlug || "" },
    });
    return NextResponse.json(
      { error: "internal_server_error" },
      { status: 500 },
    );
  }
}

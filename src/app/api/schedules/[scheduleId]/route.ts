import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/adminAuth";
import { serializeSchedule } from "@/lib/serialize";
import { LIMITS, cleanText } from "@/lib/validation";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ scheduleId: string }> }
) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const { scheduleId } = await params;

  const schedule = await prisma.schedule.findUnique({
    where: { id: scheduleId },
    include: { items: { include: { checks: true } } },
  });

  if (!schedule) {
    return NextResponse.json(
      { error: "일정을 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    shareToken: schedule.shareToken,
    ...serializeSchedule(schedule),
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ scheduleId: string }> }
) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const { scheduleId } = await params;
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const data: { title?: string; description?: string } = {};

  if (body.title !== undefined) {
    const title = cleanText(body.title, LIMITS.title);
    if (!title) {
      return NextResponse.json(
        { error: "제목을 입력해주세요." },
        { status: 400 }
      );
    }
    data.title = title;
  }

  if (body.description !== undefined) {
    if (typeof body.description !== "string") {
      return NextResponse.json(
        { error: "잘못된 설명입니다." },
        { status: 400 }
      );
    }
    data.description = body.description.trim().slice(0, LIMITS.description);
  }

  const result = await prisma.schedule.updateMany({
    where: { id: scheduleId },
    data,
  });

  if (result.count === 0) {
    return NextResponse.json(
      { error: "일정을 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ scheduleId: string }> }
) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const { scheduleId } = await params;

  const result = await prisma.schedule.deleteMany({
    where: { id: scheduleId },
  });

  if (result.count === 0) {
    return NextResponse.json(
      { error: "일정을 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true });
}

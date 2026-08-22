import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/adminAuth";
import { LIMITS, cleanOptionalText, cleanText } from "@/lib/validation";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ scheduleId: string }> }
) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const { scheduleId } = await params;
  const body = await req.json().catch(() => null);

  const text = cleanText(body?.text, LIMITS.itemText);
  if (!text) {
    return NextResponse.json(
      { error: "항목 내용을 입력해주세요." },
      { status: 400 }
    );
  }

  const schedule = await prisma.schedule.findUnique({
    where: { id: scheduleId },
    include: { items: true },
  });
  if (!schedule) {
    return NextResponse.json(
      { error: "일정을 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  if (schedule.items.length >= LIMITS.maxItems) {
    return NextResponse.json(
      { error: "항목 개수 제한을 초과했습니다." },
      { status: 400 }
    );
  }

  const maxOrder = schedule.items.reduce(
    (max, item) => Math.max(max, item.order),
    -1
  );

  const groupLabel = cleanOptionalText(body?.groupLabel, LIMITS.groupLabel) ?? null;

  const item = await prisma.checklistItem.create({
    data: { scheduleId: schedule.id, text, groupLabel, order: maxOrder + 1 },
  });

  return NextResponse.json({
    id: item.id,
    text: item.text,
    groupLabel: item.groupLabel,
    order: item.order,
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

  if (!Array.isArray(body?.order) || !body.order.every((id: unknown) => typeof id === "string")) {
    return NextResponse.json(
      { error: "잘못된 순서 데이터입니다." },
      { status: 400 }
    );
  }
  const orderedIds: string[] = body.order;

  const schedule = await prisma.schedule.findUnique({
    where: { id: scheduleId },
    include: { items: true },
  });
  if (!schedule) {
    return NextResponse.json(
      { error: "일정을 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  const validIds = new Set(schedule.items.map((item) => item.id));
  if (
    orderedIds.length !== schedule.items.length ||
    !orderedIds.every((id) => validIds.has(id))
  ) {
    return NextResponse.json(
      { error: "항목 목록이 일치하지 않습니다." },
      { status: 400 }
    );
  }

  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.checklistItem.update({ where: { id }, data: { order: index } })
    )
  );

  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/adminAuth";
import { LIMITS, cleanText } from "@/lib/validation";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ scheduleId: string; itemId: string }> }
) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const { scheduleId, itemId } = await params;
  const body = await req.json().catch(() => null);

  const text = cleanText(body?.text, LIMITS.itemText);
  if (!text) {
    return NextResponse.json(
      { error: "항목 내용을 입력해주세요." },
      { status: 400 }
    );
  }

  const result = await prisma.checklistItem.updateMany({
    where: { id: itemId, scheduleId },
    data: { text },
  });

  if (result.count === 0) {
    return NextResponse.json(
      { error: "항목을 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ scheduleId: string; itemId: string }> }
) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const { scheduleId, itemId } = await params;

  const result = await prisma.checklistItem.deleteMany({
    where: { id: itemId, scheduleId },
  });

  if (result.count === 0) {
    return NextResponse.json(
      { error: "항목을 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true });
}

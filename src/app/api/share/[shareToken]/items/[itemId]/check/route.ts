import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { LIMITS, cleanText } from "@/lib/validation";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ shareToken: string; itemId: string }> }
) {
  const { shareToken, itemId } = await params;
  const body = await req.json().catch(() => null);

  const nickname = cleanText(body?.nickname, LIMITS.nickname);
  if (!nickname) {
    return NextResponse.json(
      { error: "닉네임을 입력해주세요." },
      { status: 400 }
    );
  }

  const checked = Boolean(body?.checked);

  const item = await prisma.checklistItem.findFirst({
    where: { id: itemId, schedule: { shareToken } },
  });
  if (!item) {
    return NextResponse.json(
      { error: "항목을 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  if (checked) {
    await prisma.checkMark.upsert({
      where: { itemId_nickname: { itemId, nickname } },
      update: {},
      create: { itemId, nickname },
    });
  } else {
    await prisma.checkMark.deleteMany({
      where: { itemId, nickname },
    });
  }

  return NextResponse.json({ ok: true });
}

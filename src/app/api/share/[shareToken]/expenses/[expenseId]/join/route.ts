import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { LIMITS, cleanText } from "@/lib/validation";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ shareToken: string; expenseId: string }> }
) {
  const { shareToken, expenseId } = await params;
  const body = await req.json().catch(() => null);

  const nickname = cleanText(body?.nickname, LIMITS.nickname);
  if (!nickname) {
    return NextResponse.json(
      { error: "닉네임을 입력해주세요." },
      { status: 400 }
    );
  }

  const joined = Boolean(body?.joined);

  const expense = await prisma.expense.findFirst({
    where: { id: expenseId, schedule: { shareToken } },
  });
  if (!expense) {
    return NextResponse.json(
      { error: "비용을 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  if (joined) {
    await prisma.expenseParticipant.upsert({
      where: { expenseId_nickname: { expenseId, nickname } },
      update: {},
      create: { expenseId, nickname },
    });
  } else {
    await prisma.expenseParticipant.deleteMany({
      where: { expenseId, nickname },
    });
  }

  return NextResponse.json({ ok: true });
}

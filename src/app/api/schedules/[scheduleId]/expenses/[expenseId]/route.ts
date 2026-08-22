import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/adminAuth";
import { LIMITS, cleanAmount, cleanText } from "@/lib/validation";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ scheduleId: string; expenseId: string }> }
) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const { scheduleId, expenseId } = await params;
  const body = await req.json().catch(() => null);

  const label = cleanText(body?.label, LIMITS.expenseLabel);
  if (!label) {
    return NextResponse.json(
      { error: "비용 내용을 입력해주세요." },
      { status: 400 }
    );
  }

  const amount = cleanAmount(body?.amount);
  if (!amount) {
    return NextResponse.json(
      { error: "올바른 금액을 입력해주세요." },
      { status: 400 }
    );
  }

  const payerNickname = cleanText(body?.payerNickname, LIMITS.nickname);
  if (!payerNickname) {
    return NextResponse.json(
      { error: "낸 사람을 입력해주세요." },
      { status: 400 }
    );
  }

  const result = await prisma.expense.updateMany({
    where: { id: expenseId, scheduleId },
    data: { label, amount, payerNickname },
  });

  if (result.count === 0) {
    return NextResponse.json(
      { error: "비용을 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ scheduleId: string; expenseId: string }> }
) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const { scheduleId, expenseId } = await params;

  const result = await prisma.expense.deleteMany({
    where: { id: expenseId, scheduleId },
  });

  if (result.count === 0) {
    return NextResponse.json(
      { error: "비용을 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true });
}

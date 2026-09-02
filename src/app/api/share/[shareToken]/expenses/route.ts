import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { LIMITS, cleanAmount, cleanText } from "@/lib/validation";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ shareToken: string }> }
) {
  const { shareToken } = await params;
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

  const schedule = await prisma.schedule.findUnique({
    where: { shareToken },
    include: { expenses: true },
  });
  if (!schedule) {
    return NextResponse.json(
      { error: "일정을 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  if (schedule.expenses.length >= LIMITS.maxExpenses) {
    return NextResponse.json(
      { error: "비용 개수 제한을 초과했습니다." },
      { status: 400 }
    );
  }

  const maxOrder = schedule.expenses.reduce(
    (max, expense) => Math.max(max, expense.order),
    -1
  );

  const expense = await prisma.expense.create({
    data: {
      scheduleId: schedule.id,
      label,
      amount,
      payerNickname,
      order: maxOrder + 1,
    },
  });

  return NextResponse.json({
    id: expense.id,
    label: expense.label,
    amount: expense.amount,
    payerNickname: expense.payerNickname,
    order: expense.order,
  });
}

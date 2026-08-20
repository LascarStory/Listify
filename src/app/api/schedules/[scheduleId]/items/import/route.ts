import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/adminAuth";
import { parseMarkdownChecklist } from "@/lib/markdownChecklist";
import { LIMITS } from "@/lib/validation";

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

  if (typeof body?.markdown !== "string" || body.markdown.length === 0) {
    return NextResponse.json(
      { error: "마크다운 내용을 입력해주세요." },
      { status: 400 }
    );
  }
  if (body.markdown.length > LIMITS.markdownImport) {
    return NextResponse.json(
      { error: "붙여넣은 내용이 너무 깁니다." },
      { status: 400 }
    );
  }

  const parsed = parseMarkdownChecklist(body.markdown);
  if (parsed.length === 0) {
    return NextResponse.json(
      { error: "체크리스트 항목을 찾지 못했습니다. '-'로 시작하는 줄이 항목으로 인식됩니다." },
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

  const remainingSlots = LIMITS.maxItems - schedule.items.length;
  const toAdd = parsed.slice(0, Math.max(remainingSlots, 0));
  const skipped = parsed.length - toAdd.length;

  if (toAdd.length === 0) {
    return NextResponse.json(
      { error: "항목 개수 제한을 초과했습니다." },
      { status: 400 }
    );
  }

  const maxOrder = schedule.items.reduce(
    (max, item) => Math.max(max, item.order),
    -1
  );

  await prisma.checklistItem.createMany({
    data: toAdd.map((item, index) => ({
      scheduleId,
      text: item.text,
      groupLabel: item.groupLabel,
      order: maxOrder + 1 + index,
    })),
  });

  return NextResponse.json({ added: toAdd.length, skipped });
}

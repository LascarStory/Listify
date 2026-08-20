import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateAdminToken, generateShareToken } from "@/lib/tokens";
import { LIMITS, cleanText } from "@/lib/validation";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const title = cleanText(body.title, LIMITS.title);
  if (!title) {
    return NextResponse.json(
      { error: "제목을 입력해주세요." },
      { status: 400 }
    );
  }

  const description =
    typeof body.description === "string"
      ? body.description.trim().slice(0, LIMITS.description)
      : "";

  const rawItems = Array.isArray(body.items) ? body.items : [];
  const items = rawItems
    .map((item: unknown) => cleanText(item, LIMITS.itemText))
    .filter((item: string | null): item is string => item !== null)
    .slice(0, LIMITS.maxItems);

  const schedule = await prisma.schedule.create({
    data: {
      title,
      description,
      shareToken: generateShareToken(),
      adminToken: generateAdminToken(),
      items: {
        create: items.map((text: string, order: number) => ({ text, order })),
      },
    },
  });

  return NextResponse.json({
    shareToken: schedule.shareToken,
    adminToken: schedule.adminToken,
  });
}

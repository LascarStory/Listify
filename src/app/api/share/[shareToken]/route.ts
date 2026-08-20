import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeSchedule } from "@/lib/serialize";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ shareToken: string }> }
) {
  const { shareToken } = await params;

  const schedule = await prisma.schedule.findUnique({
    where: { shareToken },
    include: { items: { include: { checks: true } } },
  });

  if (!schedule) {
    return NextResponse.json(
      { error: "일정을 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  return NextResponse.json(serializeSchedule(schedule));
}

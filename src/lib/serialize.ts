import type { Prisma } from "@/generated/prisma/client";

type ScheduleWithItems = Prisma.ScheduleGetPayload<{
  include: {
    items: { include: { checks: true } };
    expenses: { include: { participants: true } };
  };
}>;

export function serializeSchedule(schedule: ScheduleWithItems) {
  return {
    title: schedule.title,
    description: schedule.description,
    items: [...schedule.items]
      .sort((a, b) => a.order - b.order)
      .map((item) => ({
        id: item.id,
        text: item.text,
        groupLabel: item.groupLabel,
        order: item.order,
        checkedBy: item.checks
          .map((check) => ({
            nickname: check.nickname,
            checkedAt: check.checkedAt.toISOString(),
          }))
          .sort((a, b) => a.checkedAt.localeCompare(b.checkedAt)),
      })),
    expenses: [...schedule.expenses]
      .sort((a, b) => a.order - b.order)
      .map((expense) => ({
        id: expense.id,
        label: expense.label,
        amount: expense.amount,
        payerNickname: expense.payerNickname,
        order: expense.order,
        participants: expense.participants
          .map((p) => ({
            nickname: p.nickname,
            joinedAt: p.joinedAt.toISOString(),
          }))
          .sort((a, b) => a.joinedAt.localeCompare(b.joinedAt)),
      })),
  };
}

export type CheckedBy = {
  nickname: string;
  checkedAt: string;
};

export type ScheduleItem = {
  id: string;
  text: string;
  groupLabel: string | null;
  order: number;
  checkedBy: CheckedBy[];
};

export type ExpenseParticipant = {
  nickname: string;
  joinedAt: string;
};

export type Expense = {
  id: string;
  label: string;
  amount: number;
  payerNickname: string;
  order: number;
  participants: ExpenseParticipant[];
};

export type ScheduleData = {
  title: string;
  description: string;
  items: ScheduleItem[];
  expenses: Expense[];
};

export type AdminScheduleData = ScheduleData & {
  shareToken: string;
};

export type ScheduleSummary = {
  id: string;
  title: string;
  shareToken: string;
  createdAt: string;
  itemCount: number;
  checkedCount: number;
};

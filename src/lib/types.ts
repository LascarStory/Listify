export type CheckedBy = {
  nickname: string;
  checkedAt: string;
};

export type ScheduleItem = {
  id: string;
  text: string;
  order: number;
  checkedBy: CheckedBy[];
};

export type ScheduleData = {
  title: string;
  description: string;
  items: ScheduleItem[];
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

export type SettlementExpense = {
  amount: number;
  payerNickname: string;
  participants: { nickname: string }[];
};

export type Transfer = {
  from: string;
  to: string;
  amount: number;
};

export type Settlement = {
  /** Net balance per nickname in won. Positive = should receive money, negative = owes money. */
  balances: Record<string, number>;
  /** Simplified list of payments that settle every balance to zero. */
  transfers: Transfer[];
};

const ROUNDING_SLACK_WON = 1;

/**
 * Splits each expense evenly among its participants, then reduces
 * everyone's net balance across all expenses to a minimal set of
 * pairwise transfers.
 */
export function computeSettlement(expenses: SettlementExpense[]): Settlement {
  const balances = new Map<string, number>();
  const add = (nickname: string, delta: number) => {
    balances.set(nickname, (balances.get(nickname) ?? 0) + delta);
  };

  for (const expense of expenses) {
    if (expense.amount <= 0 || !expense.payerNickname) continue;
    const participants = expense.participants.map((p) => p.nickname);
    if (participants.length === 0) continue;

    const share = expense.amount / participants.length;
    add(expense.payerNickname, expense.amount);
    for (const nickname of participants) {
      add(nickname, -share);
    }
  }

  const rounded = new Map<string, number>();
  for (const [nickname, value] of balances) {
    rounded.set(nickname, Math.round(value));
  }

  const debtors = [...rounded.entries()]
    .filter(([, v]) => v < -ROUNDING_SLACK_WON)
    .map(([nickname, v]) => ({ nickname, remaining: -v }))
    .sort((a, b) => b.remaining - a.remaining);
  const creditors = [...rounded.entries()]
    .filter(([, v]) => v > ROUNDING_SLACK_WON)
    .map(([nickname, v]) => ({ nickname, remaining: v }))
    .sort((a, b) => b.remaining - a.remaining);

  const transfers: Transfer[] = [];
  let di = 0;
  let ci = 0;
  while (di < debtors.length && ci < creditors.length) {
    const debtor = debtors[di];
    const creditor = creditors[ci];
    const amount = Math.min(debtor.remaining, creditor.remaining);
    if (amount > ROUNDING_SLACK_WON) {
      transfers.push({ from: debtor.nickname, to: creditor.nickname, amount });
    }
    debtor.remaining -= amount;
    creditor.remaining -= amount;
    if (debtor.remaining <= ROUNDING_SLACK_WON) di++;
    if (creditor.remaining <= ROUNDING_SLACK_WON) ci++;
  }

  return {
    balances: Object.fromEntries(rounded),
    transfers,
  };
}

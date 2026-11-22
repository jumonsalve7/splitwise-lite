const roundTwo = (num) => Math.round((num + Number.EPSILON) * 100) / 100;

export function calculateGroupBalances(members = [], expenses = []) {
  const netBalances = {};
  for (const member of members) {
    netBalances[member] = 0;
  }

  for (const expense of expenses) {
    const amount = Number(expense.amount) || 0;
    const participants =
      Array.isArray(expense.splitBetween) && expense.splitBetween.length > 0
        ? expense.splitBetween
        : members;

    if (amount <= 0 || participants.length === 0) continue;

    if (netBalances[expense.paidBy] === undefined) {
      netBalances[expense.paidBy] = 0;
    }
    netBalances[expense.paidBy] = roundTwo(netBalances[expense.paidBy] + amount);

    const share = amount / participants.length;
    for (const person of participants) {
      if (netBalances[person] === undefined) {
        netBalances[person] = 0;
      }
      netBalances[person] = roundTwo(netBalances[person] - share);
    }
  }

  const debtors = [];
  const creditors = [];

  for (const [person, amount] of Object.entries(netBalances)) {
    const cleanAmount = roundTwo(amount);
    if (cleanAmount < -0.01) {
      debtors.push({ person, amount: Math.abs(cleanAmount) });
    } else if (cleanAmount > 0.01) {
      creditors.push({ person, amount: cleanAmount });
    }
  }

  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const settlements = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const payment = roundTwo(Math.min(debtor.amount, creditor.amount));

    if (payment > 0) {
      settlements.push({
        from: debtor.person,
        to: creditor.person,
        amount: payment,
      });
    }

    debtor.amount = roundTwo(debtor.amount - payment);
    creditor.amount = roundTwo(creditor.amount - payment);

    if (debtor.amount <= 0.01) i++;
    if (creditor.amount <= 0.01) j++;
  }

  return {
    balances: netBalances,
    settlements,
  };
}
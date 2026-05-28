import type { Payment, Transaction } from '../types';

const TOLERANCE = 0.01;

export function paymentsForTransaction(
  transaction: Transaction,
  payments: Payment[],
): Payment[] {
  const target =
    transaction['@id'] ?? `/api/transactions/${transaction.id}`;
  return payments.filter(p => {
    const txId =
      typeof p.transaction === 'string'
        ? p.transaction
        : p.transaction?.['@id'] ?? `/api/transactions/${p.transaction?.id}`;
    return txId === target || resolvePaymentTxId(p) === transaction.id;
  });
}

export interface TransactionPaymentSummary {
  totalPrice: number;
  paidAmount: number;
  remainingBalance: number;
  monthlyPayment: number;
  monthsLeft: number;
  nextDueDate: string | null;
  fullyPaid: boolean;
}

/** Earliest pending installment for a transaction (next payment due). */
export function getNextPendingPayment(
  transaction: Transaction,
  payments: Payment[],
): Payment | null {
  const pending = pendingInstallments(transaction, payments);
  return pending[0] ?? null;
}

/** Due date of the installment after the one being paid (before API refresh). */
export function getFollowingDueDate(
  transaction: Transaction,
  payments: Payment[],
  payingPaymentId: number,
): string | null {
  const pending = pendingInstallments(transaction, payments);
  const index = pending.findIndex(p => p.id === payingPaymentId);
  if (index < 0) return pending[1]?.date ?? null;
  return pending[index + 1]?.date ?? null;
}

export function formatDueDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function pendingInstallments(
  transaction: Transaction,
  payments: Payment[],
): Payment[] {
  return paymentsForTransaction(transaction, payments)
    .filter(p => p.status === 'Pending')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export function getTransactionPaymentSummary(
  transaction: Transaction,
  payments: Payment[],
): TransactionPaymentSummary {
  const txPayments = paymentsForTransaction(transaction, payments);
  const totalPrice = Number(transaction.price);
  const completed = txPayments.filter(p => p.status === 'Completed');
  const pending = txPayments
    .filter(p => p.status === 'Pending')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const paidAmount = completed.reduce((sum, p) => sum + Number(p.amount), 0);
  const remainingBalance = Math.max(0, totalPrice - paidAmount);
  const monthlyPayment =
    pending.length > 0 ? Number(pending[0].amount) : 0;
  const monthsLeft =
    pending.length > 0
      ? pending.length
      : monthlyPayment > 0
        ? Math.ceil(remainingBalance / monthlyPayment)
        : 0;
  const fullyPaid =
    txPayments.length > 0 &&
    pending.length === 0 &&
    paidAmount + TOLERANCE >= totalPrice;

  return {
    totalPrice,
    paidAmount,
    remainingBalance,
    monthlyPayment,
    monthsLeft,
    nextDueDate: pending[0]?.date ?? null,
    fullyPaid,
  };
}

export function formatMonthsLeft(months: number): string {
  if (months <= 0) return '0 months';
  return months === 1 ? '1 month' : `${months} months`;
}

export function isFullyPaid(
  transaction: Transaction,
  payments: Payment[],
): boolean {
  return getTransactionPaymentSummary(transaction, payments).fullyPaid;
}

function resolvePaymentTxId(p: Payment): number | null {
  if (typeof p.transaction === 'string') {
    const m = p.transaction.match(/\/(\d+)$/);
    return m ? Number(m[1]) : null;
  }
  return p.transaction?.id ?? null;
}

export function canCreateTransaction(
  transactions: Transaction[],
  payments: Payment[],
): boolean {
  return !transactions.some(tx => !isFullyPaid(tx, payments));
}

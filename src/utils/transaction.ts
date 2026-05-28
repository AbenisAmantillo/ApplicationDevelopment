import { resolveId } from './hydra';
import {
  normalizeFurnitureRecord,
  normalizePropertyRecord,
} from './resourceImages';
import type { Furniture, Property, Transaction, TransactionFurniture } from '../types';

/** API Platform may omit camelCase; normalize collection field names. */
export function normalizeTransactionFurnitureLine(
  raw: TransactionFurniture & Record<string, unknown>,
): TransactionFurniture {
  const furniture = raw.furniture ?? raw.furniture_item;
  return {
    ...raw,
    furniture:
      typeof furniture === 'string' || !furniture
        ? (furniture as TransactionFurniture['furniture'])
        : normalizeFurnitureRecord(furniture as Furniture & Record<string, unknown>),
    quantity: Number(raw.quantity ?? 0),
  };
}

export function normalizeTransaction(
  raw: Transaction & Record<string, unknown>,
): Transaction {
  const lines = raw.transactionFurniture ?? raw.transaction_furniture;
  const transactionFurniture = Array.isArray(lines)
    ? lines.map(l =>
        normalizeTransactionFurnitureLine(
          l as TransactionFurniture & Record<string, unknown>,
        ),
      )
    : undefined;

  return {
    ...raw,
    property:
      typeof raw.property === 'string' || !raw.property
        ? raw.property
        : normalizePropertyRecord(raw.property as Property & Record<string, unknown>),
    clientDownpaymentAmount:
      numberOrString(raw.clientDownpaymentAmount) ??
      numberOrString(raw.client_downpayment_amount),
    clientPaymentMethod:
      stringOrNull(raw.clientPaymentMethod) ??
      stringOrNull(raw.client_payment_method),
    clientPaymentPlanMonths:
      numberOrString(raw.clientPaymentPlanMonths) ??
      numberOrString(raw.client_payment_plan_months),
    transactionFurniture,
  };
}

function numberOrString(value: unknown): number | string | null | undefined {
  if (typeof value === 'number' || typeof value === 'string' || value == null) {
    return value;
  }
  return undefined;
}

function stringOrNull(value: unknown): string | null | undefined {
  if (typeof value === 'string' || value == null) {
    return value;
  }
  return undefined;
}

/** Attach line items from GET /api/transaction_furnitures when not embedded on Transaction. */
export function attachTransactionFurniture(
  transactions: Transaction[],
  lines: TransactionFurniture[],
): Transaction[] {
  const byTxId = new Map<number, TransactionFurniture[]>();

  for (const line of lines) {
    const txId = resolveId(line.transaction as Parameters<typeof resolveId>[0]);
    if (txId == null) continue;
    const normalized = normalizeTransactionFurnitureLine(
      line as TransactionFurniture & Record<string, unknown>,
    );
    const bucket = byTxId.get(txId) ?? [];
    bucket.push(normalized);
    byTxId.set(txId, bucket);
  }

  return transactions.map(tx => {
    const embedded = tx.transactionFurniture;
    if (embedded?.length) {
      return tx;
    }
    const attached = byTxId.get(tx.id);
    if (!attached?.length) {
      return tx;
    }
    return { ...tx, transactionFurniture: attached };
  });
}

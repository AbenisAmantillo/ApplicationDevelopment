import { apiClient } from './client';
import { fetchTransactionFurniture } from './transactionFurniture';
import { extractCollection } from '../utils/hydra';
import {
  attachTransactionFurniture,
  normalizeTransaction,
} from '../utils/transaction';
import type { Transaction } from '../types';

export async function fetchTransactions(): Promise<Transaction[]> {
  const [txData, furnitureLines] = await Promise.all([
    apiClient.get('/api/transactions'),
    fetchTransactionFurniture().catch(() => []),
  ]);
  const raw = extractCollection<Transaction & Record<string, unknown>>(
    txData.data,
  );
  const transactions = raw.map(normalizeTransaction);
  return attachTransactionFurniture(transactions, furnitureLines);
}

export async function fetchTransaction(id: number): Promise<Transaction> {
  const { data } = await apiClient.get<Transaction & Record<string, unknown>>(
    `/api/transactions/${id}`,
  );
  const [tx, furnitureLines] = await Promise.all([
    Promise.resolve(normalizeTransaction(data)),
    fetchTransactionFurniture().catch(() => []),
  ]);
  const [enriched] = attachTransactionFurniture([tx], furnitureLines);
  return enriched;
}

export async function createTransaction(
  body: Record<string, unknown>,
): Promise<Transaction> {
  const { data } = await apiClient.post<Transaction>('/api/transactions', body);
  return data;
}

export async function updateTransaction(
  id: number,
  body: Record<string, unknown>,
): Promise<Transaction> {
  const { data } = await apiClient.put<Transaction>(
    `/api/transactions/${id}`,
    body,
  );
  return data;
}

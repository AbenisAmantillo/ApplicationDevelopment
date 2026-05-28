import { apiClient } from './client';
import { extractCollection } from '../utils/hydra';
import type { TransactionFurniture } from '../types';

export async function fetchTransactionFurniture(): Promise<
  TransactionFurniture[]
> {
  const { data } = await apiClient.get('/api/transaction_furnitures');
  return extractCollection<TransactionFurniture>(data);
}

export async function createTransactionFurniture(body: {
  transaction: string;
  furniture: string;
  quantity: number;
}): Promise<TransactionFurniture> {
  const { data } = await apiClient.post<TransactionFurniture>(
    '/api/transaction_furnitures',
    body,
  );
  return data;
}

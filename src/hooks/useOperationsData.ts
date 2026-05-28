import { useCallback, useEffect, useMemo, useState } from 'react';

import { getErrorMessage } from '../api/client';
import { fetchFurniture } from '../api/furniture';
import { fetchPayments } from '../api/payments';
import { fetchProperties } from '../api/properties';
import { fetchTransactions } from '../api/transactions';
import type { Furniture, Payment, Property, Transaction } from '../types';
import { isFurnitureAvailable, isPropertyAvailable } from '../utils';

export function useOperationsData() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [furniture, setFurniture] = useState<Furniture[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (): Promise<Payment[]> => {
    setLoading(true);
    setError('');
    try {
      const [props, furn, txs, pays] = await Promise.all([
        fetchProperties(),
        fetchFurniture(),
        fetchTransactions(),
        fetchPayments(),
      ]);
      setProperties(props);
      setFurniture(furn);
      setTransactions(txs);
      setPayments(pays);
      return pays;
    } catch (e) {
      setError(getErrorMessage(e));
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = useMemo(
    () => ({
      availableProperties: properties.filter(p => isPropertyAvailable(p.status))
        .length,
      availableFurniture: furniture.filter(
        f => isFurnitureAvailable(f.status) && (f.stock == null || f.stock > 0),
      ).length,
      transactions: transactions.length,
      pendingPayments: payments.filter(p => p.status !== 'Completed').length,
    }),
    [furniture, payments, properties, transactions],
  );

  return {
    properties,
    furniture,
    transactions,
    payments,
    stats,
    loading,
    error,
    refresh: load,
  };
}

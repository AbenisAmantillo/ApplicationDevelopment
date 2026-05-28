import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { getErrorMessage } from '../api/client';
import { useAutoRefresh } from './useAutoRefresh';
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

  const load = useCallback(async (options?: { silent?: boolean }): Promise<Payment[]> => {
    if (!options?.silent) {
      setLoading(true);
    }
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
      if (!options?.silent) {
        setLoading(false);
      }
    }
  }, []);

  const silentRefresh = useCallback(() => {
    void load({ silent: true });
  }, [load]);

  useEffect(() => {
    void load();
  }, [load]);

  const skipNextFocusRefresh = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (skipNextFocusRefresh.current) {
        skipNextFocusRefresh.current = false;
        return;
      }
      void silentRefresh();
    }, [silentRefresh]),
  );

  useAutoRefresh(silentRefresh);

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

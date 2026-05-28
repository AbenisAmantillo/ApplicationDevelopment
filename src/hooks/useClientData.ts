import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getErrorMessage } from '../api/client';
import { useAutoRefresh } from './useAutoRefresh';
import { fetchFurniture } from '../api/furniture';
import { fetchPayments } from '../api/payments';
import { fetchProperties } from '../api/properties';
import { fetchTransactions } from '../api/transactions';
import { useAuth } from '../auth/AuthContext';
import type { Furniture, Payment, Property, Transaction } from '../types';
import {
  canCreateTransaction,
  isCurrentUserCustomer,
  isFurnitureAvailable,
  isPropertyAvailable,
} from '../utils';

export function useClientData() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [furniture, setFurniture] = useState<Furniture[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (options?: { silent?: boolean }): Promise<Payment[]> => {
    if (!user) return [];
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
      const mine = txs.filter(tx => isCurrentUserCustomer(tx.customer, user));
      setTransactions(mine);
      const myPayments = pays.filter(p =>
        isCurrentUserCustomer(p.customer, user),
      );
      setPayments(myPayments);
      return myPayments;
    } catch (e) {
      setError(getErrorMessage(e));
      return [];
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }
    }
  }, [user]);

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

  useAutoRefresh(silentRefresh, { enabled: Boolean(user) });

  const availableProperties = properties
    .filter(p => isPropertyAvailable(p.status))
    .sort((a, b) => b.id - a.id)
    .slice(0, 6);

  const availableFurniture = furniture
    .filter(
      f =>
        isFurnitureAvailable(f.status) &&
        (f.stock == null || f.stock > 0),
    )
    .slice(0, 6);

  const completedPayments = payments
    .filter(p => p.status === 'Completed')
    .sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

  const userCanCreate = canCreateTransaction(transactions, payments);

  const checkoutFurniture = furniture.filter(
    f =>
      isFurnitureAvailable(f.status) &&
      (f.stock == null || f.stock > 0),
  );

  return {
    properties,
    furniture,
    transactions,
    payments,
    availableProperties,
    availableFurniture,
    completedPayments,
    userCanCreate,
    checkoutFurniture,
    loading,
    error,
    refresh: load,
  };
}

import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { completeInstallment } from '../api/payments';
import { getErrorMessage } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { ClientScreenHeader } from '../components/ClientScreenHeader';
import { ErrorBanner } from '../components/ErrorBanner';
import { EstateEmpty, EstateHero, SectionHeader } from '../components/estate';
import { LoadingView } from '../components/LoadingView';
import { useOperationsData } from '../hooks/useOperationsData';
import { estate, estateStyles } from '../theme/estate';
import type { Payment, Transaction, User } from '../types';
import { formatCurrency, resolveId, ROUTES } from '../utils';

export default function RolePaymentsScreen() {
  const { isStaff } = useAuth();
  const { payments, transactions, loading, error, refresh } = useOperationsData();
  const [confirmingId, setConfirmingId] = useState<number | string | null>(null);

  const sorted = useMemo(
    () =>
      [...payments].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      ),
    [payments],
  );

  if (loading && !sorted.length) return <LoadingView />;

  const handleConfirm = (payment: Payment) => {
    Alert.alert(
      'Confirm payment',
      'Mark this payment as completed? The backend still controls whether your role may complete it.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            void confirmPayment(payment);
          },
        },
      ],
    );
  };

  const confirmPayment = async (payment: Payment) => {
    const key = paymentKey(payment);
    setConfirmingId(key);
    try {
      await completeInstallment(
        payment,
        payment.paymentMethod ?? 'cash',
        new Date().toISOString(),
        transactionForPayment(payment, transactions),
      );
      await refresh();
    } catch (e) {
      Alert.alert('Payment not confirmed', getErrorMessage(e));
    } finally {
      setConfirmingId(null);
    }
  };

  return (
    <View style={estateStyles.root}>
      <ClientScreenHeader
        activeRoute={ROUTES.PAYMENT}
        greeting="Payments"
        subtitle={isStaff ? 'Receive & confirm' : 'Overview'}
        tone="estate"
      />

      <ScrollView
        style={estateStyles.flex}
        contentContainerStyle={estateStyles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refresh}
            tintColor={estate.gold}
            colors={[estate.navy]}
          />
        }
      >
        <ErrorBanner message={error} />
        <EstateHero
          eyebrow={estate.brandEyebrow}
          title="Payments overview"
          subtitle={
            isStaff
              ? 'Staff can confirm pending payments allowed by the backend.'
              : 'Admin overview is read-only unless backend permissions allow more.'
          }
        />

        <SectionHeader
          title="Payments"
          subtitle={`${sorted.length} backend records`}
        />
        {sorted.length === 0 ? (
          <EstateEmpty
            icon="P"
            title="No payments"
            message="Payment records allowed by the backend will appear here."
          />
        ) : (
          sorted.map(payment => {
            const completed = payment.status === 'Completed';
            const key = paymentKey(payment);
            const busy = confirmingId === key;
            return (
              <View key={key} style={estateStyles.card}>
                <View style={styles.header}>
                  <Text style={estateStyles.cardTitle}>
                    {formatCurrency(Number(payment.amount))}
                  </Text>
                  <StatusBadge status={payment.status} />
                </View>
                <Text style={estateStyles.cardMeta}>
                  Customer: {customerLabel(payment.customer)}
                </Text>
                <Text style={estateStyles.cardMeta}>
                  Method: {payment.paymentMethod} -{' '}
                  {new Date(payment.date).toLocaleDateString()}
                </Text>
                {isStaff && !completed ? (
                  <Pressable
                    style={[styles.button, busy && styles.buttonDisabled]}
                    disabled={busy}
                    onPress={() => handleConfirm(payment)}
                  >
                    {busy ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.buttonText}>Confirm payment</Text>
                    )}
                  </Pressable>
                ) : null}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

function paymentKey(payment: Payment): number | string {
  return payment.id ?? payment['@id'] ?? `${payment.transaction}-${payment.date}`;
}

function customerLabel(customer: Payment['customer']): string {
  if (typeof customer === 'string') {
    const id = resolveId(customer);
    return id != null ? `User #${id}` : customer;
  }
  const user = customer as User;
  return user.username ?? user.email ?? (user.id != null ? `User #${user.id}` : 'User');
}

function transactionForPayment(
  payment: Payment,
  transactions: Transaction[],
): Transaction | undefined {
  const id = resolveId(payment.transaction as string | Transaction);
  return id != null ? transactions.find(tx => tx.id === id) : undefined;
}

function StatusBadge({ status }: { status: string }) {
  const complete = status === 'Completed';
  return (
    <View
      style={[
        estateStyles.badge,
        complete ? estateStyles.badgePaid : estateStyles.badgeUnpaid,
      ]}
    >
      <Text
        style={[
          estateStyles.badgeText,
          complete ? estateStyles.badgeTextPaid : estateStyles.badgeTextUnpaid,
        ]}
      >
        {status}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  button: {
    marginTop: 14,
    backgroundColor: estate.navy,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.65 },
  buttonText: { color: '#fff', fontWeight: '800' },
});

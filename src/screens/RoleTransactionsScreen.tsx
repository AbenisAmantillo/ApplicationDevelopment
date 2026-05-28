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

import { completeInstallment, createPayment } from '../api/payments';
import { getErrorMessage } from '../api/client';
import { ClientScreenHeader } from '../components/ClientScreenHeader';
import { ErrorBanner } from '../components/ErrorBanner';
import { EstateEmpty, EstateHero, SectionHeader } from '../components/estate';
import { LoadingView } from '../components/LoadingView';
import { useOperationsData } from '../hooks/useOperationsData';
import { estate, estateStyles } from '../theme/estate';
import {
  type Payment,
  type PaymentMethod,
  type Property,
  type Transaction,
  type User,
} from '../types';
import { formatCurrency, resolveId, ROUTES } from '../utils';
import { resourceIri } from '../utils/hydra';

type SubmittedPayment =
  | { source: 'payment'; payment: Payment }
  | {
      source: 'transaction';
      amount: number;
      paymentMethod: PaymentMethod;
      date: string;
      status: string;
    };

export default function RoleTransactionsScreen() {
  const { transactions, properties, payments, loading, error, refresh } =
    useOperationsData();
  const [openTransactionId, setOpenTransactionId] = useState<number | null>(null);
  const [submittingKey, setSubmittingKey] = useState<string | null>(null);

  const sorted = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  const paymentTotals = useMemo(() => {
    const totals = new Map<number, number>();
    for (const payment of payments) {
      if (payment.status !== 'Completed') continue;
      const txId = resolveId(payment.transaction as Transaction | string);
      if (txId == null) continue;
      totals.set(txId, (totals.get(txId) ?? 0) + Number(payment.amount ?? 0));
    }
    return totals;
  }, [payments]);

  const pendingPaymentsByTransaction = useMemo(() => {
    const grouped = new Map<number, Payment[]>();
    for (const payment of payments) {
      if (payment.status === 'Completed') continue;
      const txId = resolveId(payment.transaction as Transaction | string);
      if (txId == null) continue;
      const bucket = grouped.get(txId) ?? [];
      bucket.push(payment);
      grouped.set(txId, bucket);
    }
    for (const bucket of grouped.values()) {
      bucket.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );
    }
    return grouped;
  }, [payments]);

  if (loading && !transactions.length) return <LoadingView />;

  const openReceivePayment = (tx: Transaction) => {
    setOpenTransactionId(current => (current === tx.id ? null : tx.id));
  };

  const handleReceivePayment = async (
    tx: Transaction,
    submitted: SubmittedPayment,
  ) => {
    const key = submittedPaymentKey(tx, submitted);
    setSubmittingKey(key);
    try {
      if (submitted.source === 'payment') {
        await completeInstallment(
          submitted.payment,
          submitted.payment.paymentMethod,
          new Date().toISOString(),
          tx,
        );
      } else {
        await createPayment({
          transaction: transactionRef(tx),
          customer: customerRef(tx.customer),
          amount: submitted.amount,
          paymentMethod: submitted.paymentMethod,
          status: 'Completed',
          date: new Date().toISOString(),
        });
      }
      await refresh();
      setOpenTransactionId(null);
      Alert.alert('Payment recorded', 'The payment was recorded as completed.');
    } catch (e) {
      Alert.alert('Payment not recorded', getErrorMessage(e));
    } finally {
      setSubmittingKey(null);
    }
  };

  return (
    <View style={estateStyles.root}>
      <ClientScreenHeader
        activeRoute={ROUTES.TRANSACTIONS}
        greeting="Transactions"
        subtitle="Backend overview"
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
          title="Transactions overview"
          subtitle="All records returned by /api/transactions for the signed-in role."
        />

        <SectionHeader
          title="Transactions"
          subtitle={`${sorted.length} backend records`}
        />
        {sorted.length === 0 ? (
          <EstateEmpty
            icon="T"
            title="No transactions"
            message="Transaction records allowed by the backend will appear here."
          />
        ) : (
          sorted.map(tx => {
            const paid = paymentTotals.get(tx.id) ?? 0;
            const remaining = Math.max(Number(tx.price) - paid, 0);
            const pendingPayments = pendingPaymentsByTransaction.get(tx.id) ?? [];
            const submittedPayment =
              pendingPayments[0] != null
                ? ({ source: 'payment', payment: pendingPayments[0] } as const)
                : transactionSubmittedPayment(tx, paid);
            const formOpen = openTransactionId === tx.id;
            const submitting =
              submittedPayment != null &&
              submittingKey === submittedPaymentKey(tx, submittedPayment);
            return (
              <View key={tx.id} style={estateStyles.card}>
                <Text style={estateStyles.cardTitle}>
                  {propertyTitle(tx, properties)}
                </Text>
                <Text style={estateStyles.cardMeta}>
                  Customer: {customerLabel(tx.customer)}
                </Text>
                <Text style={estateStyles.cardMeta}>
                  {tx.purchaseType} - {new Date(tx.date).toLocaleDateString()}
                </Text>
                <Text style={estateStyles.cardAmount}>
                  {formatCurrency(Number(tx.price))}
                </Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryText}>
                    Paid: {formatCurrency(paid)}
                  </Text>
                  <Text style={styles.summaryText}>
                    Balance: {formatCurrency(remaining)}
                  </Text>
                </View>

                <Pressable
                  style={[
                    styles.receiveButton,
                    !submittedPayment && styles.receiveButtonDisabled,
                  ]}
                  disabled={!submittedPayment}
                  onPress={() => openReceivePayment(tx)}
                >
                  <Text style={styles.receiveButtonText}>
                    {submittedPayment
                      ? formOpen
                        ? 'Hide submitted payment'
                        : 'Receive submitted payment'
                      : 'No submitted payment'}
                  </Text>
                </Pressable>

                {formOpen && submittedPayment ? (
                  <View style={styles.form}>
                    <Text style={styles.label}>Client submitted payment</Text>
                    <View style={styles.detailBox}>
                      <DetailRow
                        label="Amount"
                        value={formatCurrency(submittedPaymentAmount(submittedPayment))}
                      />
                      <DetailRow
                        label="Method"
                        value={paymentMethodLabel(
                          submittedPaymentMethod(submittedPayment),
                        )}
                      />
                      <DetailRow
                        label="Submitted"
                        value={new Date(
                          submittedPaymentDate(tx, submittedPayment),
                        ).toLocaleDateString()}
                      />
                      <DetailRow
                        label="Status"
                        value={submittedPaymentStatus(submittedPayment)}
                      />
                    </View>

                    <Pressable
                      style={[
                        styles.submitButton,
                        submitting && styles.submitButtonDisabled,
                      ]}
                      disabled={submitting}
                      onPress={() => handleReceivePayment(tx, submittedPayment)}
                    >
                      {submitting ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.submitButtonText}>
                          Confirm and record payment
                        </Text>
                      )}
                    </Pressable>
                  </View>
                ) : null}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

function customerLabel(customer: Transaction['customer']): string {
  if (typeof customer === 'string') {
    const id = resolveId(customer);
    return id != null ? `User #${id}` : customer;
  }
  const user = customer as User;
  return user.username ?? user.email ?? (user.id != null ? `User #${user.id}` : 'User');
}

function propertyTitle(tx: Transaction, properties: Property[]): string {
  if (typeof tx.property !== 'string') {
    return tx.property.title ?? `Property #${tx.property.id}`;
  }
  const id = resolveId(tx.property);
  const property = id != null ? properties.find(p => p.id === id) : undefined;
  return property?.title ?? (id != null ? `Property #${id}` : 'Property');
}

function paymentKey(payment: Payment): string {
  return String(payment.id ?? payment['@id'] ?? `${payment.transaction}-${payment.date}`);
}

function submittedPaymentKey(
  tx: Transaction,
  submitted: SubmittedPayment,
): string {
  if (submitted.source === 'payment') return paymentKey(submitted.payment);
  return `transaction-${tx.id}-downpayment`;
}

function transactionSubmittedPayment(
  tx: Transaction,
  completedPaidAmount: number,
): SubmittedPayment | null {
  const rawAmount = tx.clientDownpaymentAmount;
  const amount =
    typeof rawAmount === 'number'
      ? rawAmount
      : typeof rawAmount === 'string'
        ? Number(rawAmount)
        : 0;
  if (!Number.isFinite(amount) || amount <= 0 || completedPaidAmount >= amount) {
    return null;
  }

  const method =
    typeof tx.clientPaymentMethod === 'string' && tx.clientPaymentMethod.trim()
      ? (tx.clientPaymentMethod as PaymentMethod)
      : 'cash';

  return {
    source: 'transaction',
    amount,
    paymentMethod: method,
    date: tx.date,
    status: 'Submitted at checkout',
  };
}

function submittedPaymentAmount(submitted: SubmittedPayment): number {
  return submitted.source === 'payment'
    ? Number(submitted.payment.amount)
    : submitted.amount;
}

function submittedPaymentMethod(submitted: SubmittedPayment): string {
  return submitted.source === 'payment'
    ? submitted.payment.paymentMethod
    : submitted.paymentMethod;
}

function submittedPaymentDate(
  tx: Transaction,
  submitted: SubmittedPayment,
): string {
  return submitted.source === 'payment' ? submitted.payment.date : submitted.date || tx.date;
}

function submittedPaymentStatus(submitted: SubmittedPayment): string {
  return submitted.source === 'payment' ? submitted.payment.status : submitted.status;
}

function paymentMethodLabel(method: string): string {
  return method
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function transactionRef(tx: Transaction): string {
  return tx['@id'] ?? resourceIri('transactions', tx.id);
}

function customerRef(customer: Transaction['customer']): string {
  if (typeof customer === 'string') {
    if (customer.startsWith('/api/')) return customer;
    const id = resolveId(customer);
    if (id != null) return resourceIri('users', id);
    return customer;
  }
  const customerWithIri = customer as User & { '@id'?: string };
  if (customerWithIri['@id']) return customerWithIri['@id'];
  if (customer.id != null) return resourceIri('users', customer.id);
  throw new Error('Transaction customer is missing a user id.');
}

const styles = StyleSheet.create({
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 12,
  },
  summaryText: { color: estate.sub, fontSize: 13, fontWeight: '700' },
  receiveButton: {
    marginTop: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: estate.navy,
    paddingVertical: 12,
    alignItems: 'center',
  },
  receiveButtonDisabled: {
    opacity: 0.55,
    borderColor: estate.border,
  },
  receiveButtonText: { color: estate.navy, fontWeight: '800' },
  form: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: estate.border,
    paddingTop: 14,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: estate.sub,
    letterSpacing: 0.6,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  detailBox: {
    borderWidth: 1,
    borderColor: estate.border,
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#fff',
    marginBottom: 14,
    gap: 8,
  },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  detailLabel: { color: estate.sub, fontSize: 13 },
  detailValue: {
    color: estate.text,
    fontSize: 13,
    fontWeight: '800',
    flexShrink: 1,
    textAlign: 'right',
  },
  submitButton: {
    borderRadius: 10,
    backgroundColor: estate.navy,
    paddingVertical: 13,
    alignItems: 'center',
  },
  submitButtonDisabled: { opacity: 0.65 },
  submitButtonText: { color: '#fff', fontWeight: '800' },
});

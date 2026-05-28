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

import { submitInstallmentPayment } from '../api/payments';
import { getErrorMessage } from '../api/client';
import { LoadingView } from '../components/LoadingView';
import { ErrorBanner } from '../components/ErrorBanner';
import { ClientScreenHeader } from '../components/ClientScreenHeader';
import { PaymentMethodPicker } from '../components/PaymentMethodPicker';
import {
  EstateEmpty,
  EstateHero,
  SectionHeader,
  StatChip,
} from '../components/estate';
import { useClientData } from '../hooks/useClientData';
import {
  ROUTES,
  formatCurrency,
  formatDueDate,
  getNextPendingPayment,
  getTransactionPaymentSummary,
  isFullyPaid,
  resolveId,
} from '../utils';
import { logEvent } from '../utils/firebase';
import { estate, estateStyles } from '../theme/estate';
import {
  type Payment,
  type PaymentMethod,
  type Property,
  type Transaction,
} from '../types';

export default function PaymentScreen() {
  const { transactions, payments, properties, loading, error, refresh } =
    useClientData();

  const sorted = useMemo(
    () =>
      [...transactions].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      ),
    [transactions],
  );
  const active = sorted.find(tx => !isFullyPaid(tx, payments));

  const activeSummary = active
    ? getTransactionPaymentSummary(active, payments)
    : null;

  if (loading && sorted.length === 0) {
    return <LoadingView />;
  }

  return (
    <View style={estateStyles.root}>
      <ClientScreenHeader
        activeRoute={ROUTES.PAYMENT}
        greeting="Payments"
        subtitle="Installments"
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
          title="Manage your installments"
          subtitle="View balances, due dates, and submit payment details for staff confirmation."
        />

        <View style={estateStyles.statsColumn}>
          <StatChip
            stacked
            label="Purchases"
            value={String(sorted.length)}
          />
          <StatChip
            stacked
            label="Balance due"
            value={
              activeSummary
                ? formatCurrency(activeSummary.remainingBalance)
                : '—'
            }
          />
          <StatChip
            stacked
            label="Monthly"
            value={
              activeSummary && activeSummary.monthlyPayment > 0
                ? formatCurrency(activeSummary.monthlyPayment)
                : '—'
            }
          />
        </View>

        {sorted.length === 0 ? (
          <EstateEmpty
            icon="💳"
            title="No payment plan yet"
            message="Choose a property on the Dashboard to start an installment purchase."
          />
        ) : active ? (
          <PaymentDetailsCard
            transaction={active}
            properties={properties}
            payments={payments}
            onPaymentComplete={refresh}
          />
        ) : (
          <View style={estateStyles.card}>
            <Text style={estateStyles.cardTitle}>All payments complete</Text>
            <Text style={estateStyles.cardMeta}>
              You have no outstanding balance on your purchases. Thank you for
              staying current.
            </Text>
          </View>
        )}

        {sorted.length > 1 ? (
          <>
            <SectionHeader
              title="All Purchases"
              subtitle="Payment status for every property"
            />
            {sorted.map(tx => (
              <PaymentSummaryRow
                key={tx.id}
                transaction={tx}
                properties={properties}
                payments={payments}
              />
            ))}
          </>
        ) : null}

        <View style={estateStyles.footer}>
          <Text style={estateStyles.footerText}>
            Payments are confirmed by staff before balances update
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function PaymentDetailsCard({
  transaction,
  properties,
  payments,
  onPaymentComplete,
}: {
  transaction: Transaction;
  properties: Property[];
  payments: Parameters<typeof getTransactionPaymentSummary>[1];
  onPaymentComplete: () => Promise<Payment[]>;
}) {
  const summary = getTransactionPaymentSummary(transaction, payments);
  const nextPayment = getNextPendingPayment(transaction, payments);
  const title = propertyTitle(transaction.property, properties);

  return (
    <View style={estateStyles.card}>
      <Text style={estateStyles.cardTitle}>{title}</Text>
      <Text style={estateStyles.cardMeta}>
        {transaction.purchaseType} ·{' '}
        {new Date(transaction.date).toLocaleDateString()}
      </Text>
      <View style={estateStyles.detailsBlock}>
        <DetailRow label="Total price" value={formatCurrency(summary.totalPrice)} />
        <DetailRow label="Amount paid" value={formatCurrency(summary.paidAmount)} />
        {summary.nextDueDate ? (
          <DetailRow
            label="Next due"
            value={new Date(summary.nextDueDate).toLocaleDateString()}
          />
        ) : null}
      </View>

      {nextPayment ? (
        <PayNextInstallment
          transaction={transaction}
          payment={nextPayment}
          onSuccess={onPaymentComplete}
        />
      ) : null}
    </View>
  );
}

function PayNextInstallment({
  transaction,
  payment,
  onSuccess,
}: {
  transaction: Transaction;
  payment: Payment;
  onSuccess: () => Promise<Payment[]>;
}) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    payment.paymentMethod ?? 'debit_card',
  );
  const [submitting, setSubmitting] = useState(false);

  const dueLabel = formatDueDate(payment.date);

  const handlePay = async () => {
    setSubmitting(true);
    try {
      await submitInstallmentPayment(payment, paymentMethod);
      await onSuccess();
      logEvent('installment_payment_submitted', {
        transaction_id: String(transaction.id),
        payment_id: payment.id != null ? String(payment.id) : 'pending',
        value: Number(payment.amount),
        payment_method: paymentMethod,
      }).catch(() => undefined);
      const amountLabel = formatCurrency(Number(payment.amount));
      Alert.alert(
        'Payment submitted',
        `Your payment details for ${amountLabel} were sent for staff confirmation.\n\nYour balance will update after staff confirms the payment.`,
      );
    } catch (e) {
      Alert.alert('Payment failed', getErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={s.paySection}>
      <Text style={s.paySectionTitle}>Submit installment payment</Text>
      <Text style={estateStyles.cardMeta}>
        Submit your payment method below. Staff will confirm the payment before
        it is marked as paid.
      </Text>

      <View style={s.payDueCard}>
        <View style={s.payDueRow}>
          <Text style={s.payDueLabel}>Amount due</Text>
          <Text style={s.payDueAmount}>
            {formatCurrency(Number(payment.amount))}
          </Text>
        </View>
        <View style={s.payDueDivider} />
        <View style={s.payDueRow}>
          <Text style={s.payDueLabel}>Due date</Text>
          <Text style={s.payDueValue}>{dueLabel}</Text>
        </View>
      </View>

      <Text style={s.payLabel}>Payment method</Text>
      <PaymentMethodPicker
        value={paymentMethod}
        onChange={setPaymentMethod}
        disabled={submitting}
      />

      <Pressable
        style={[
          estateStyles.primaryBtn,
          submitting && estateStyles.primaryBtnDisabled,
        ]}
        onPress={handlePay}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={estateStyles.primaryBtnText}>
            Submit {formatCurrency(Number(payment.amount))}
          </Text>
        )}
      </Pressable>
    </View>
  );
}

function PaymentSummaryRow({
  transaction,
  properties,
  payments,
}: {
  transaction: Transaction;
  properties: Property[];
  payments: Parameters<typeof getTransactionPaymentSummary>[1];
}) {
  const summary = getTransactionPaymentSummary(transaction, payments);
  const title = propertyTitle(transaction.property, properties);

  return (
    <View style={estateStyles.rowCard}>
      <Text style={estateStyles.rowTitle}>{title}</Text>
      <Text style={estateStyles.rowMeta}>
        {summary.fullyPaid
          ? 'Paid in full'
          : `${formatCurrency(summary.remainingBalance)} remaining · ${formatCurrency(summary.monthlyPayment)}/mo`}
      </Text>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={estateStyles.detailRow}>
      <Text style={estateStyles.detailLabel}>{label}</Text>
      <Text style={estateStyles.detailValue}>{value}</Text>
    </View>
  );
}

function propertyTitle(
  property: Property | string,
  catalog: Property[],
): string {
  if (typeof property !== 'string') {
    return property.title ?? `Property #${property.id}`;
  }
  const id = resolveId(property);
  const match = id != null ? catalog.find(p => p.id === id) : undefined;
  return match?.title ?? (id != null ? `Property #${id}` : 'Property');
}

const s = StyleSheet.create({
  paySection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: estate.border,
  },
  paySectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: estate.text,
  },
  payDueCard: {
    marginTop: 14,
    backgroundColor: estate.accentBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    overflow: 'hidden',
  },
  payDueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  payDueDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#BBF7D0',
  },
  payDueLabel: { fontSize: 13, color: estate.sub, fontWeight: '600' },
  payDueAmount: { fontSize: 18, fontWeight: '800', color: estate.accent },
  payDueValue: { fontSize: 14, fontWeight: '700', color: estate.text },
  payLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: estate.sub,
    marginTop: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

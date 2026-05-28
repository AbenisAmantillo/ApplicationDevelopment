import { useMemo } from 'react';
import {
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { LoadingView } from '../components/LoadingView';
import { ErrorBanner } from '../components/ErrorBanner';
import { ClientScreenHeader } from '../components/ClientScreenHeader';
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
  furnitureImageUrl,
  isFullyPaid,
  propertyImageUrl,
  resolveId,
} from '../utils';
import { estate, estateStyles } from '../theme/estate';
import type { Furniture, Property, TransactionFurniture } from '../types';

export default function MyTransactionsScreen() {
  const {
    transactions,
    payments,
    furniture,
    properties,
    loading,
    error,
    refresh,
    userCanCreate,
  } = useClientData();

  const sorted = useMemo(
    () =>
      [...transactions].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      ),
    [transactions],
  );

  const paidCount = useMemo(
    () => sorted.filter(tx => isFullyPaid(tx, payments)).length,
    [sorted, payments],
  );
  const outstandingCount = sorted.length - paidCount;

  if (loading && sorted.length === 0) {
    return <LoadingView />;
  }

  return (
    <View style={estateStyles.root}>
      <ClientScreenHeader
        activeRoute={ROUTES.MY_TRANSACTIONS}
        greeting="Your Portfolio"
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
          title="Purchase history"
          subtitle="Track every property purchase, installment status, and included furnishings in one place."
        />

        <View style={estateStyles.statsRow}>
          <StatChip label="Purchases" value={String(sorted.length)} />
          <StatChip label="Paid in full" value={String(paidCount)} />
          <StatChip label="Pending" value={String(outstandingCount)} />
        </View>

        {!userCanCreate ? (
          <View style={estateStyles.warnBanner}>
            <Text style={estateStyles.warnIcon}>⚠</Text>
            <Text style={estateStyles.warnText}>
              You have unpaid installments. New purchases are blocked until all
              payments are completed.
            </Text>
          </View>
        ) : null}

        <SectionHeader
          title="Your Transactions"
          subtitle={
            sorted.length
              ? `${sorted.length} recorded ${
                  sorted.length === 1 ? 'purchase' : 'purchases'
                }`
              : 'No activity yet'
          }
        />

        {sorted.length === 0 ? (
          <EstateEmpty
            icon="📋"
            title="No transactions yet"
            message="When you select a property from the dashboard, your purchase will appear here."
          />
        ) : (
          sorted.map(tx => {
            const paid = isFullyPaid(tx, payments);
            const imageUri = propertyImageForTransaction(tx.property, properties);
            return (
              <View key={tx.id} style={[estateStyles.card, s.cardWithImage]}>
                <Image source={{ uri: imageUri }} style={s.cardImage} />
                <View style={s.cardBody}>
                  <View style={s.cardHeader}>
                    <Text style={estateStyles.cardTitle}>
                      {propertyTitle(tx.property, properties)}
                    </Text>
                    <View
                      style={[
                        estateStyles.badge,
                        paid ? estateStyles.badgePaid : estateStyles.badgeUnpaid,
                      ]}
                    >
                      <Text
                        style={[
                          estateStyles.badgeText,
                          paid
                            ? estateStyles.badgeTextPaid
                            : estateStyles.badgeTextUnpaid,
                        ]}
                      >
                        {paid ? 'Fully paid' : 'On payment plan'}
                      </Text>
                    </View>
                  </View>
                  <Text style={estateStyles.cardMeta}>
                    {tx.purchaseType} ·{' '}
                    {new Date(tx.date).toLocaleDateString()}
                  </Text>
                  <Text style={estateStyles.cardAmount}>
                    {formatCurrency(Number(tx.price))}
                  </Text>
                  {tx.transactionFurniture?.length ? (
                    <View style={s.lines}>
                      <Text style={s.linesLabel}>Furnishings included</Text>
                      {tx.transactionFurniture.map((line, idx) => (
                        <View key={idx} style={s.lineRow}>
                          <Image
                            source={{
                              uri: furnitureImageForLine(line, furniture),
                            }}
                            style={s.lineThumb}
                          />
                          <Text style={s.lineItem}>
                            {furnitureLineLabel(line, furniture)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ) : null}
                </View>
              </View>
            );
          })
        )}

        <View style={estateStyles.footer}>
          <Text style={estateStyles.footerText}>
            Installment status updates when payments are recorded
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function propertyImageForTransaction(
  property: Property | string,
  catalog: Property[],
): string {
  if (typeof property !== 'string') {
    return propertyImageUrl(property.imageFileName);
  }
  const id = resolveId(property);
  const match = id != null ? catalog.find(p => p.id === id) : undefined;
  return propertyImageUrl(match?.imageFileName);
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

function furnitureImageForLine(
  line: TransactionFurniture,
  catalog: Furniture[],
): string {
  const furn = line.furniture;
  if (typeof furn !== 'string') {
    return furnitureImageUrl(furn.image);
  }
  const id = resolveId(furn);
  const match = id != null ? catalog.find(f => f.id === id) : undefined;
  return furnitureImageUrl(match?.image);
}

function furnitureLineLabel(
  line: TransactionFurniture,
  catalog: Furniture[],
): string {
  const furn = line.furniture;
  if (typeof furn !== 'string') {
    return `${furn.name} × ${line.quantity}`;
  }
  const id = resolveId(furn);
  const match = id != null ? catalog.find(f => f.id === id) : undefined;
  const name = match?.name ?? (id != null ? `Furniture #${id}` : 'Furniture');
  return `${name} × ${line.quantity}`;
}

const s = StyleSheet.create({
  cardWithImage: { padding: 0, overflow: 'hidden' },
  cardImage: {
    width: '100%',
    height: 140,
    backgroundColor: estate.border,
  },
  cardBody: { padding: 16 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  lines: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: estate.border,
  },
  linesLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: estate.sub,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  lineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 10,
  },
  lineThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: estate.border,
  },
  lineItem: { flex: 1, fontSize: 13, color: estate.text },
});

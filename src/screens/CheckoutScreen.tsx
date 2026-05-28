import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import { submitCheckout } from '../api/checkout';
import { fetchProperty } from '../api/properties';
import { ErrorBanner } from '../components/ErrorBanner';
import { LoadingView } from '../components/LoadingView';
import { ClientScreenHeader } from '../components/ClientScreenHeader';
import { PaymentMethodPicker } from '../components/PaymentMethodPicker';
import { EstateEmpty, EstateHero, SectionHeader } from '../components/estate';
import { useAuth } from '../auth/AuthContext';
import { useClientData } from '../hooks/useClientData';
import type { CheckoutLine } from '../api/checkout';
import type { Furniture, Property } from '../types';
import {
  PAYMENT_PLAN_MONTHS,
  PaymentMethod,
  PaymentPlanMonths,
} from '../types';
import {
  formatCurrency,
  furnitureImageUrl,
  isPropertyAvailable,
  propertyImageUrl,
  ROUTES,
} from '../utils';
import { logEvent } from '../utils/firebase';
import { getErrorMessage } from '../api/client';
import { showLocalTransactionSuccessNotification } from '../utils/notifications';
import { estate, estateStyles } from '../theme/estate';
import type { MainStackParamList } from '../navigation/types';

function resolvePropertyId(params: { propertyId?: number } | undefined): number | null {
  const id = params?.propertyId;
  if (id == null || !Number.isFinite(id) || id <= 0) return null;
  return id;
}

function CheckoutHeader() {
  return (
    <ClientScreenHeader
      activeRoute={ROUTES.CHECKOUT}
      greeting="Checkout"
      subtitle="Complete purchase"
      tone="estate"
    />
  );
}

export default function CheckoutScreen() {
  const route = useRoute<RouteProp<MainStackParamList, typeof ROUTES.CHECKOUT>>();
  const propertyId = resolvePropertyId(
    route.params as { propertyId?: number } | undefined,
  );
  const navigation =
    useNavigation<StackNavigationProp<MainStackParamList>>();
  const { user } = useAuth();
  const { checkoutFurniture, userCanCreate, refresh } = useClientData();

  const [property, setProperty] = useState<Property | null>(null);
  const [loadingProperty, setLoadingProperty] = useState(propertyId != null);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [selected, setSelected] = useState<Record<number, boolean>>({});
  const [downpayment, setDownpayment] = useState('');
  const [paymentPlan, setPaymentPlan] = useState<PaymentPlanMonths>(12);
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>('debit_card');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    const id = propertyId;
    if (id == null) {
      setLoadingProperty(false);
      return;
    }

    (async () => {
      setLoadingProperty(true);
      try {
        const p = await fetchProperty(id);
        if (!isPropertyAvailable(p.status)) {
          setLoadError('This property is no longer available.');
        }
        setProperty(p);
      } catch (e) {
        setLoadError(getErrorMessage(e));
      } finally {
        setLoadingProperty(false);
      }
    })();
  }, [propertyId]);

  const lines: CheckoutLine[] = useMemo(() => {
    return checkoutFurniture
      .filter(f => selected[f.id] && (quantities[f.id] ?? 0) > 0)
      .map(f => ({ furniture: f, quantity: quantities[f.id] ?? 0 }));
  }, [checkoutFurniture, selected, quantities]);

  const furnitureTotal = lines.reduce(
    (s, l) => s + l.furniture.price * l.quantity,
    0,
  );
  const propertyTotal = property?.price ?? 0;
  const grandTotal = propertyTotal + furnitureTotal;

  const toggleFurniture = (item: Furniture) => {
    setSelected(prev => {
      const next = !prev[item.id];
      const copy = { ...prev, [item.id]: next };
      if (next && !quantities[item.id]) {
        setQuantities(q => ({ ...q, [item.id]: 1 }));
      }
      return copy;
    });
  };

  const setQty = (item: Furniture, delta: number) => {
    const max = item.stock ?? 9999;
    const current = quantities[item.id] ?? 0;
    const next = Math.min(max, Math.max(0, current + delta));
    setQuantities(q => ({ ...q, [item.id]: next }));
    if (next > 0) setSelected(s => ({ ...s, [item.id]: true }));
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    const dp = parseFloat(downpayment);
    if (!Number.isFinite(dp) || dp < 0.01) {
      next.downpayment = 'Downpayment must be at least ₱0.01.';
    } else if (dp > grandTotal) {
      next.downpayment = 'Downpayment cannot exceed the grand total.';
    }
    if (!user?.id) {
      next.general =
        'Unable to determine your user id. Log out and log in again.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!property || !user) return;
    if (!userCanCreate) {
      Alert.alert(
        'Active transaction',
        'Complete outstanding payments before starting a new purchase.',
      );
      return;
    }
    if (!validate()) return;

    setSubmitting(true);
    try {
      const transactionId = await submitCheckout({
        property,
        lines,
        downpayment: parseFloat(downpayment),
        paymentPlan,
        paymentMethod,
        user,
      });
      await refresh();
      void logEvent('checkout_completed', {
        transaction_id: String(transactionId),
        property_id: String(property.id),
        furniture_count: lines.length,
        value: grandTotal,
        downpayment: parseFloat(downpayment),
        payment_plan_months: paymentPlan,
        payment_method: paymentMethod,
      });
      void showLocalTransactionSuccessNotification().catch(() => undefined);
      Alert.alert('Success', 'Your transaction has been created.', [
        {
          text: 'View transactions',
          onPress: () => {
            navigation.navigate(ROUTES.MAIN_TABS, {
              screen: ROUTES.MY_TRANSACTIONS,
            } as never);
          },
        },
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Checkout failed', getErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  if (propertyId == null) {
    return (
      <View style={estateStyles.root}>
        <CheckoutHeader />
        <View style={s.center}>
          <EstateEmpty
            icon="🏠"
            title="No property selected"
            message="Select a property from the Dashboard to continue checkout."
          />
        </View>
      </View>
    );
  }

  if (loadingProperty) {
    return (
      <View style={estateStyles.root}>
        <CheckoutHeader />
        <LoadingView />
      </View>
    );
  }

  if (!property) {
    return (
      <View style={estateStyles.root}>
        <CheckoutHeader />
        <View style={s.center}>
          <ErrorBanner message={loadError || 'Property not found.'} />
        </View>
      </View>
    );
  }

  return (
    <View style={estateStyles.root}>
      <CheckoutHeader />
      <ScrollView
        style={estateStyles.flex}
        contentContainerStyle={estateStyles.scroll}
      >
        <ErrorBanner message={loadError || errors.general || ''} />

        {!userCanCreate ? (
          <View style={estateStyles.warnBanner}>
            <Text style={estateStyles.warnIcon}>⚠</Text>
            <Text style={estateStyles.warnText}>
              Complete outstanding payments before starting a new purchase.
            </Text>
          </View>
        ) : null}

        <EstateHero
          eyebrow={estate.brandEyebrow}
          title="Complete your purchase"
          subtitle="Review the listing, add optional furnishings, and set up your installment plan."
        />

        <SectionHeader title="Selected Property" subtitle="Listing details" />
        <View style={s.propertyCard}>
          <View style={s.imageWrap}>
            <Image
              source={{ uri: propertyImageUrl(property.imageFileName) }}
              style={s.propertyImage}
            />
            <View style={s.imageShade} />
            <View style={s.badge}>
              <Text style={s.badgeText}>For purchase</Text>
            </View>
            <View style={s.priceOnImage}>
              <Text style={s.priceLabel}>Listed at</Text>
              <Text style={s.priceOnImageValue}>
                {formatCurrency(property.price)}
              </Text>
            </View>
          </View>
          <View style={s.propertyBody}>
            <Text style={s.propertyTitle}>{property.title}</Text>
            <View style={s.locationRow}>
              <Text style={s.locationIcon}>📍</Text>
              <Text style={s.propertyAddress}>{property.address}</Text>
            </View>
          </View>
        </View>

        <SectionHeader
          title="Optional Furnishings"
          subtitle="Add items to stage your new home"
        />
        {checkoutFurniture.length === 0 ? (
          <EstateEmpty
            icon="🛋"
            title="No furnishings available"
            message="You can proceed with the property purchase only."
          />
        ) : (
          checkoutFurniture.map(item => (
            <View
              key={item.id}
              style={[
                s.furnitureRow,
                selected[item.id] && s.furnitureRowSelected,
              ]}
            >
              <Pressable onPress={() => toggleFurniture(item)} hitSlop={8}>
                <Text style={s.checkbox}>
                  {selected[item.id] ? '☑' : '☐'}
                </Text>
              </Pressable>
              <Image
                source={{ uri: furnitureImageUrl(item.image) }}
                style={s.thumb}
              />
              <View style={s.furnitureInfo}>
                <Text style={s.furnitureName}>{item.name}</Text>
                <Text style={s.furnitureMeta}>
                  {formatCurrency(item.price)}
                  {item.stock != null ? ` · Stock: ${item.stock}` : ''}
                </Text>
                <View style={s.qtyRow}>
                  <Pressable
                    onPress={() => setQty(item, -1)}
                    style={s.qtyBtn}
                  >
                    <Text style={s.qtyBtnText}>−</Text>
                  </Pressable>
                  <Text style={s.qty}>{quantities[item.id] ?? 0}</Text>
                  <Pressable onPress={() => setQty(item, 1)} style={s.qtyBtn}>
                    <Text style={s.qtyBtnText}>+</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ))
        )}

        <SectionHeader title="Order Summary" subtitle="Purchase breakdown" />
        <View style={[estateStyles.highlight, s.summaryHighlight]}>
          <View style={estateStyles.highlightBlock}>
            <Text style={estateStyles.highlightLabel}>Property</Text>
            <Text style={estateStyles.highlightValue}>
              {formatCurrency(propertyTotal)}
            </Text>
          </View>
          <View style={estateStyles.highlightDivider} />
          <View style={estateStyles.highlightBlock}>
            <Text style={estateStyles.highlightLabel}>Furnishings</Text>
            <Text style={estateStyles.highlightValue}>
              {formatCurrency(furnitureTotal)}
            </Text>
          </View>
        </View>
        <View style={s.grandTotalCard}>
          <Text style={s.grandLabel}>Grand total</Text>
          <Text style={s.grandValue}>{formatCurrency(grandTotal)}</Text>
        </View>

        <SectionHeader
          title="Payment Plan"
          subtitle="Downpayment and installment terms"
        />
        <View style={estateStyles.card}>
          <Text style={s.inputLabel}>Downpayment (₱)</Text>
          <TextInput
            style={s.input}
            value={downpayment}
            onChangeText={setDownpayment}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor={estate.sub}
          />
          {errors.downpayment ? (
            <Text style={s.fieldError}>{errors.downpayment}</Text>
          ) : null}

          <Text style={s.inputLabel}>Payment plan (months)</Text>
          <View style={s.chipRow}>
            {PAYMENT_PLAN_MONTHS.map(m => (
              <Pressable
                key={m}
                style={[s.chip, paymentPlan === m && s.chipActive]}
                onPress={() => setPaymentPlan(m)}
              >
                <Text
                  style={[s.chipText, paymentPlan === m && s.chipTextActive]}
                >
                  {m} mo
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={s.inputLabel}>Payment method</Text>
          <PaymentMethodPicker
            value={paymentMethod}
            onChange={setPaymentMethod}
            disabled={submitting}
          />

          <Text style={s.inputLabel}>Notes (optional)</Text>
          <TextInput
            style={[s.input, s.notes]}
            value={notes}
            onChangeText={setNotes}
            multiline
            placeholder="Add a note for your records"
            placeholderTextColor={estate.sub}
          />
        </View>

        <Pressable
          style={[
            estateStyles.primaryBtn,
            s.submitBtn,
            submitting && estateStyles.primaryBtnDisabled,
          ]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={estateStyles.primaryBtnText}>Submit payment plan</Text>
          )}
        </Pressable>

        <View style={estateStyles.footer}>
          <Text style={estateStyles.footerText}>
            Your installment schedule begins after checkout is confirmed
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', padding: 16 },

  propertyCard: {
    marginHorizontal: 16,
    backgroundColor: estate.surface,
    borderRadius: estate.radius,
    overflow: 'hidden',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: estate.border,
    shadowColor: estate.navy,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  imageWrap: { position: 'relative' },
  propertyImage: { width: '100%', height: 200, backgroundColor: estate.border },
  imageShade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '55%',
    backgroundColor: 'rgba(15, 41, 66, 0.45)',
  },
  badge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(15, 41, 66, 0.88)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  priceOnImage: { position: 'absolute', bottom: 12, left: 12, right: 12 },
  priceLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  priceOnImageValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    marginTop: 2,
  },
  propertyBody: { padding: 16 },
  propertyTitle: { fontSize: 18, fontWeight: '800', color: estate.text },
  locationRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 4, marginTop: 8 },
  locationIcon: { fontSize: 12, marginTop: 2 },
  propertyAddress: { flex: 1, fontSize: 13, color: estate.sub, lineHeight: 18 },

  furnitureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    backgroundColor: estate.surface,
    padding: 12,
    borderRadius: estate.radius,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: estate.border,
  },
  furnitureRowSelected: {
    borderColor: estate.gold,
    backgroundColor: estate.goldBg,
  },
  checkbox: { fontSize: 22, marginRight: 10, color: estate.navy },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 10,
    marginRight: 12,
    backgroundColor: estate.border,
  },
  furnitureInfo: { flex: 1 },
  furnitureName: { fontWeight: '700', fontSize: 14, color: estate.text },
  furnitureMeta: { fontSize: 12, color: estate.sub, marginTop: 2 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: estate.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: { color: '#fff', fontSize: 18, fontWeight: '700', lineHeight: 20 },
  qty: { marginHorizontal: 14, fontWeight: '800', fontSize: 15, color: estate.text },

  summaryHighlight: { marginHorizontal: 16 },
  grandTotalCard: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: estate.navy,
    borderRadius: estate.radius,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  grandLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.75)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  grandValue: { fontSize: 22, fontWeight: '800', color: '#fff' },

  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: estate.sub,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: estate.border,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    backgroundColor: estate.bg,
    color: estate.text,
    fontSize: 15,
  },
  notes: { minHeight: 72, textAlignVertical: 'top' },
  fieldError: { color: estate.danger, marginTop: -8, marginBottom: 8, fontSize: 13 },
  chipRow: { flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: estate.border,
    backgroundColor: estate.bg,
  },
  chipActive: { backgroundColor: estate.navy, borderColor: estate.navy },
  chipText: { color: estate.text, fontWeight: '600', fontSize: 14 },
  chipTextActive: { color: '#fff', fontWeight: '700' },
  submitBtn: { marginHorizontal: 16, marginTop: 8 },
});

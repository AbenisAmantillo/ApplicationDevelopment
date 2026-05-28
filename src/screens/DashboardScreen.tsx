import { useCallback, useMemo } from 'react';
import {
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';

import { PropertyCard } from '../components/PropertyCard';
import { LoadingView } from '../components/LoadingView';
import { ErrorBanner } from '../components/ErrorBanner';
import { ClientScreenHeader } from '../components/ClientScreenHeader';
import {
  EstateEmpty,
  EstateHero,
  SectionHeader,
} from '../components/estate';
import { useClientData } from '../hooks/useClientData';
import { ROUTES, formatCurrency, furnitureImageUrl } from '../utils';
import { logImageError } from '../utils/imageDiagnostics';
import { estate, estateStyles } from '../theme/estate';
import type { MainStackParamList, MainTabParamList } from '../navigation/types';

export default function DashboardScreen() {
  const navigation = useNavigation<StackNavigationProp<MainTabParamList>>();
  const {
    availableProperties,
    availableFurniture,
    userCanCreate,
    loading,
    error,
    refresh,
  } = useClientData();

  const featured = useMemo(
    () => availableProperties.slice(0, 4),
    [availableProperties],
  );
  const moreListings = useMemo(
    () => availableProperties.slice(4),
    [availableProperties],
  );

  const onSelectProperty = useCallback(
    (id: number) =>
      navigation
        .getParent<StackNavigationProp<MainStackParamList>>()
        ?.navigate(ROUTES.CHECKOUT, { propertyId: id }),
    [navigation],
  );

  if (loading && !availableProperties.length) return <LoadingView />;

  return (
    <View style={estateStyles.root}>
      <ClientScreenHeader
        activeRoute={ROUTES.DASHBOARD}
        greeting="Welcome Back!"
        tone="estate"
        showNotifications
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
          title="Discover your next home"
          subtitle="Browse available listings, explore financing options, and stage your space with curated furnishings."
        />

        {!userCanCreate ? (
          <View style={estateStyles.warnBanner}>
            <Text style={estateStyles.warnIcon}>⚠</Text>
            <Text style={estateStyles.warnText}>
              Complete outstanding payments before starting a new purchase.
            </Text>
          </View>
        ) : null}

        <SectionHeader
          title="Featured Listings"
          subtitle="Hand-picked properties available now"
        />
        {featured.length === 0 ? (
          <EstateEmpty
            icon="🏘"
            title="No listings yet"
            message="New properties will appear here when they become available."
          />
        ) : (
          <FlatList
            horizontal
            data={featured}
            keyExtractor={p => String(p.id)}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.carousel}
            renderItem={({ item }) => (
              <PropertyCard
                property={item}
                variant="featured"
                selectDisabled={!userCanCreate}
                onSelect={() => onSelectProperty(item.id)}
                style={s.carouselCard}
              />
            )}
          />
        )}

        {moreListings.length > 0 ? (
          <>
            <SectionHeader
              title="More Listings"
              subtitle={`${moreListings.length} additional ${
                moreListings.length === 1 ? 'property' : 'properties'
              }`}
            />
            {moreListings.map(p => (
              <PropertyCard
                key={p.id}
                property={p}
                selectDisabled={!userCanCreate}
                onSelect={() => onSelectProperty(p.id)}
              />
            ))}
          </>
        ) : null}

        <SectionHeader
          title="Home Furnishings"
          subtitle="Stage and furnish your new property"
        />
        {availableFurniture.length === 0 ? (
          <EstateEmpty
            icon="🛋"
            title="No furnishings in stock"
            message="Check back soon for new inventory."
          />
        ) : (
          <FlatList
            horizontal
            data={availableFurniture}
            keyExtractor={i => String(i.id)}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.furnitureList}
            renderItem={({ item }) => {
              const imageUri = furnitureImageUrl(item.image);
              return (
                <View style={s.furnitureCard}>
                  <Image
                    source={{ uri: imageUri }}
                    style={s.furnitureImg}
                    onError={event =>
                      logImageError(`furniture:${item.id}`, imageUri, event)
                    }
                  />
                  <View style={s.furnitureBadge}>
                    <Text style={s.furnitureBadgeText}>In stock</Text>
                  </View>
                  <View style={s.furnitureInfo}>
                    <Text style={s.furnitureName} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <Text style={s.furniturePrice}>
                      {formatCurrency(item.price)}
                    </Text>
                  </View>
                </View>
              );
            }}
          />
        )}

        <View style={estateStyles.footer}>
          <Text style={estateStyles.footerText}>
            All listings subject to availability · Secure installment checkout
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  carousel: { paddingHorizontal: 16, paddingBottom: 4 },
  carouselCard: { marginRight: 14 },

  furnitureList: { paddingHorizontal: 16, paddingBottom: 4 },
  furnitureCard: {
    width: 156,
    marginRight: 12,
    backgroundColor: estate.surface,
    borderRadius: estate.radius,
    borderWidth: 1,
    borderColor: estate.border,
    overflow: 'hidden',
  },
  furnitureImg: { width: 156, height: 100, backgroundColor: estate.border },
  furnitureBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: estate.accentBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  furnitureBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: estate.accent,
    textTransform: 'uppercase',
  },
  furnitureInfo: { padding: 12 },
  furnitureName: {
    fontSize: 13,
    fontWeight: '600',
    color: estate.text,
    lineHeight: 17,
    minHeight: 34,
  },
  furniturePrice: {
    fontSize: 14,
    fontWeight: '800',
    color: estate.navy,
    marginTop: 6,
  },
});

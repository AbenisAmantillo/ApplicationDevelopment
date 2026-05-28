import {
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ClientScreenHeader } from '../components/ClientScreenHeader';
import { ErrorBanner } from '../components/ErrorBanner';
import { EstateEmpty, EstateHero, SectionHeader } from '../components/estate';
import { LoadingView } from '../components/LoadingView';
import { useOperationsData } from '../hooks/useOperationsData';
import { estate, estateStyles } from '../theme/estate';
import { logImageError } from '../utils/imageDiagnostics';
import { furnitureImageSource, propertyImageSource } from '../utils/resourceImages';
import {
  formatCurrency,
  furnitureImageUrl,
  propertyImageUrl,
  ROUTES,
} from '../utils';

export default function RoleCatalogScreen() {
  const { properties, furniture, loading, error, refresh } = useOperationsData();

  if (loading && !properties.length && !furniture.length) return <LoadingView />;

  return (
    <View style={estateStyles.root}>
      <ClientScreenHeader
        activeRoute={ROUTES.CATALOG}
        greeting="Catalog"
        subtitle="Properties & furniture"
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
          title="Property and catalog management"
          subtitle="Read-only mobile view. Updates still depend on backend authorization."
        />

        <SectionHeader
          title="Properties"
          subtitle={`${properties.length} backend records`}
        />
        {properties.length === 0 ? (
          <EstateEmpty
            icon="P"
            title="No properties"
            message="Property records returned by /api/properties will appear here."
          />
        ) : (
          properties.map(property => {
            const imageUri = propertyImageUrl(propertyImageSource(property));
            return (
              <View key={property.id} style={[estateStyles.card, styles.imageCard]}>
                <Image
                  source={{ uri: imageUri }}
                  style={styles.image}
                  resizeMode="cover"
                  onError={event =>
                    logImageError(`catalog-property:${property.id}`, imageUri, event)
                  }
                />
                <View style={styles.cardBody}>
                  <Text style={estateStyles.cardTitle}>{property.title}</Text>
                  <Text style={estateStyles.cardMeta}>{property.address}</Text>
                  <View style={styles.row}>
                    <Text style={estateStyles.cardAmount}>
                      {formatCurrency(property.price)}
                    </Text>
                    <StatusBadge value={property.status} />
                  </View>
                </View>
              </View>
            );
          })
        )}

        <SectionHeader
          title="Furniture Catalog"
          subtitle={`${furniture.length} backend records`}
        />
        {furniture.length === 0 ? (
          <EstateEmpty
            icon="F"
            title="No furniture"
            message="Catalog records returned by /api/furniture will appear here."
          />
        ) : (
          furniture.map(item => {
            const imageUri = furnitureImageUrl(furnitureImageSource(item));
            return (
              <View key={item.id} style={[estateStyles.card, styles.imageCard]}>
                <Image
                  source={{ uri: imageUri }}
                  style={styles.image}
                  resizeMode="cover"
                  onError={event =>
                    logImageError(`catalog-furniture:${item.id}`, imageUri, event)
                  }
                />
                <View style={styles.cardBody}>
                  <Text style={estateStyles.cardTitle}>{item.name}</Text>
                  <Text style={estateStyles.cardMeta}>
                    Stock: {item.stock ?? 'Untracked'}
                  </Text>
                  <View style={styles.row}>
                    <Text style={estateStyles.cardAmount}>
                      {formatCurrency(item.price)}
                    </Text>
                    <StatusBadge value={item.status} />
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

function StatusBadge({ value }: { value: string }) {
  return (
    <View style={estateStyles.badge}>
      <Text style={[estateStyles.badgeText, styles.badgeText]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  imageCard: { padding: 0, overflow: 'hidden' },
  image: {
    width: '100%',
    height: 170,
    backgroundColor: estate.border,
  },
  cardBody: { padding: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 6,
  },
  badgeText: { color: estate.navy },
});

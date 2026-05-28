import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import type { Property } from '../types';
import { formatCurrency, propertyImageUrl } from '../utils';
import { logImageError } from '../utils/imageDiagnostics';
import { colors } from '../theme';

interface PropertyCardProps {
  property: Property;
  onSelect: () => void;
  selectDisabled?: boolean;
  variant?: 'list' | 'featured';
  style?: ViewStyle;
}

export function PropertyCard({
  property,
  onSelect,
  selectDisabled,
  variant = 'list',
  style,
}: PropertyCardProps) {
  const featured = variant === 'featured';
  const imageUri = propertyImageUrl(property.imageFileName);

  return (
    <View style={[featured ? styles.cardFeatured : styles.card, style]}>
      <View style={featured ? styles.imageWrapFeatured : styles.imageWrap}>
        <Image
          source={{ uri: imageUri }}
          style={featured ? styles.imageFeatured : styles.image}
          onError={event =>
            logImageError(`property:${property.id}`, imageUri, event)
          }
        />
        <View style={styles.imageShade} />
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Available</Text>
        </View>
        <View style={styles.priceOnImage}>
          <Text style={styles.priceLabel}>Listed at</Text>
          <Text style={styles.priceOnImageValue}>
            {formatCurrency(property.price)}
          </Text>
        </View>
      </View>
      <View style={featured ? styles.bodyFeatured : styles.body}>
        <Text style={styles.title} numberOfLines={featured ? 1 : 2}>
          {property.title}
        </Text>
        <View style={styles.locationRow}>
          <Text style={styles.locationIcon}>📍</Text>
          <Text style={styles.address} numberOfLines={featured ? 1 : 2}>
            {property.address}
          </Text>
        </View>
        {!featured ? (
          <Text style={styles.price}>{formatCurrency(property.price)}</Text>
        ) : null}
        <Pressable
          style={[styles.btn, selectDisabled && styles.btnDisabled]}
          onPress={onSelect}
          disabled={selectDisabled}
        >
          <Text style={styles.btnText}>
            {selectDisabled ? 'Unavailable' : 'View Property'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const estate = {
  navy: '#0F2942',
  gold: '#C4A052',
  cream: '#FAF8F5',
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 3,
    shadowColor: estate.navy,
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  cardFeatured: {
    width: 280,
    backgroundColor: colors.card,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 3,
    shadowColor: estate.navy,
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
  },
  imageWrap: { position: 'relative' },
  imageWrapFeatured: { position: 'relative' },
  image: { width: '100%', height: 200, backgroundColor: colors.border },
  imageFeatured: { width: '100%', height: 168, backgroundColor: colors.border },
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
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  priceOnImage: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
  },
  priceLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  priceOnImageValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    marginTop: 2,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  body: { padding: 16 },
  bodyFeatured: { padding: 14 },
  title: { fontSize: 17, fontWeight: '700', color: colors.text },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
    marginTop: 6,
  },
  locationIcon: { fontSize: 12, marginTop: 1 },
  address: { flex: 1, fontSize: 13, color: colors.textMuted, lineHeight: 18 },
  price: {
    fontSize: 18,
    fontWeight: '800',
    color: estate.navy,
    marginTop: 10,
  },
  btn: {
    marginTop: 14,
    backgroundColor: estate.navy,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnDisabled: { backgroundColor: '#94a3b8' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 14, letterSpacing: 0.2 },
});

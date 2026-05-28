import { Text, View } from 'react-native';
import { estateStyles } from '../../theme/estate';

type Props = { label: string; value: string; stacked?: boolean };

export function StatChip({ label, value, stacked }: Props) {
  return (
    <View
      style={[estateStyles.statChip, stacked && estateStyles.statChipStacked]}
    >
      <Text style={estateStyles.statValue}>{value}</Text>
      <Text style={estateStyles.statLabel}>{label}</Text>
    </View>
  );
}

import { Text, View } from 'react-native';
import { estateStyles } from '../../theme/estate';

type Props = {
  eyebrow?: string;
  title: string;
  subtitle: string;
};

export function EstateHero({ eyebrow, title, subtitle }: Props) {
  return (
    <View style={estateStyles.hero}>
      {eyebrow ? <Text style={estateStyles.heroEyebrow}>{eyebrow}</Text> : null}
      <Text style={estateStyles.heroTitle}>{title}</Text>
      <Text style={estateStyles.heroSubtitle}>{subtitle}</Text>
    </View>
  );
}

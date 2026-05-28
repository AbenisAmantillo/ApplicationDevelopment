import { Pressable, Text, View } from 'react-native';
import { estateStyles } from '../../theme/estate';

type Props = {
  title: string;
  subtitle?: string;
  action?: string;
  onAction?: () => void;
};

export function SectionHeader({ title, subtitle, action, onAction }: Props) {
  return (
    <View style={estateStyles.sectionHeader}>
      <View style={estateStyles.sectionHeaderLeft}>
        <Text style={estateStyles.sectionTitle}>{title}</Text>
        {subtitle ? (
          <Text style={estateStyles.sectionSubtitle}>{subtitle}</Text>
        ) : null}
      </View>
      {action && onAction ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={estateStyles.sectionAction}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

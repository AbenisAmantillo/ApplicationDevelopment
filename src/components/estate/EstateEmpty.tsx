import { Text, View } from 'react-native';
import { estateStyles } from '../../theme/estate';

type Props = {
  icon: string;
  title: string;
  message: string;
};

export function EstateEmpty({ icon, title, message }: Props) {
  return (
    <View style={estateStyles.empty}>
      <Text style={estateStyles.emptyIcon}>{icon}</Text>
      <Text style={estateStyles.emptyTitle}>{title}</Text>
      <Text style={estateStyles.emptyText}>{message}</Text>
    </View>
  );
}

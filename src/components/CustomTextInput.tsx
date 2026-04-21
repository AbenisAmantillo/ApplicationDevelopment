import { Text, View } from 'react-native';
import { TextInput } from 'react-native-gesture-handler';

interface CustomTextInputProps {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  textStyle?: any;
  containerStyle?: any;
}

const CustomTextInput = ({
  label,
  placeholder,
  value,
  onChangeText,
  textStyle,
  containerStyle,
}: CustomTextInputProps) => {
  return (
    <View style={containerStyle}>
      <Text style={{ fontWeight: 'bold' }}>{label}</Text>
      <TextInput
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        style={[
          textStyle,
          {
            width: '100%',
            borderBottomWidth: 1,
          },
        ]}
      />
    </View>
  );
};

export default CustomTextInput;

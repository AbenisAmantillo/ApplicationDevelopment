import { Text, TouchableOpacity, View } from 'react-native';

interface CustomButtonProps {
  containerStyle?: any;
  textStyle?: any;
  label: string;
  onPress: () => void;
}

const CustomButton = ({ containerStyle, textStyle, label, onPress }: CustomButtonProps) => {
  return (
    <View style={containerStyle}>
      <TouchableOpacity onPress={onPress}>
        <View
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            padding: 10,
          }}
        >
          <Text style={textStyle}>{label}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default CustomButton;

//CustomButton component
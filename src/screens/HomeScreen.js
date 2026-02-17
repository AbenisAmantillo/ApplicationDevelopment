import { useNavigation } from '@react-navigation/native';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { IMG, ROUTES } from '../utils';

const HomeScreen = () => {
  const navigation = useNavigation();
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: 'red',
      }}
    >
      <Image
        source={IMG.LOGO}
        style={{ width: 320, height: 100 }}
      />
      <Text style={{ fontSize: 20 }}>HomeScreen</Text>

      {/* <Button title="GO TO PROFILE" /> */}

      <TouchableOpacity
        onPress={() => {
          navigation.navigate(ROUTES.PROFILE);
        }}
      >
        <View
          style={{
            backgroundColor: 'green',
            padding: 10,
            borderRadius: 20,
          }}
        >
          <Text style={{ fontSize: 40, color: 'white' }}>VISIT PROFILE</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default HomeScreen;
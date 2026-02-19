import { useNavigation } from '@react-navigation/native';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { IMG, ROUTES } from '../utils';
const ProfileScreen = () => {
  const navigation = useNavigation();
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: 'white',
      }}
    >
      <Image
        source={IMG.LOGO2}
        style={{ width: 400, height: 380 }}
      />
      <Text style={{ fontSize: 40 }}>ProfileScreen</Text>
      <TouchableOpacity
        onPress={() => {
          navigation.navigate(ROUTES.HOME);
        }}
      >
        <View
          style={{
            backgroundColor: 'gray',
            padding: 10,
            borderRadius: 20,
          }}
        >
          <Text style={{ fontSize: 40, color: 'white' }}>BACK TO HOME</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default ProfileScreen;
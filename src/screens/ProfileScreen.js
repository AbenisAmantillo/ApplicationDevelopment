import { Image, Text, View } from 'react-native';
import IMG from '../utils/images';
const ProfileScreen = () => {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: 'blue',
      }}
    >
      <Image
        source={IMG.LOGO2}
      />
      <Text style={{ fontSize: 40 }}>ProfileScreen</Text>
    </View>
  );
};

export default ProfileScreen;
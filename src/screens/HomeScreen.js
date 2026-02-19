import { useNavigation, useRoute } from '@react-navigation/native';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { IMG, ROUTES } from '../utils';

const HomeScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { setIsLoggedIn } = route.params || {};
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
        source={IMG.LOGO}
        style={{ width: 400, height: 200 }}
      />
      <Text style={{ fontSize: 20 }}></Text>

      {/* <Button title="GO TO PROFILE" /> */}

      <TouchableOpacity
        onPress={() => {
          navigation.navigate(ROUTES.PROFILE);
        }}
      >
        <View
          style={{
            backgroundColor: 'gray',
            padding: 10,
            borderRadius: 20,
          }}
        >
          <Text style={{ fontSize: 40, color: 'white' }}>VISIT PROFILE</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => {
          if (setIsLoggedIn) {
            setIsLoggedIn(false);
          }
        }}
      >
        <View
          style={{
            marginTop: 20,
            backgroundColor: 'gray',
            padding: 10,
            borderRadius: 20,
          }}
        >
          <Text style={{ fontSize: 40, color: 'white' }} >Log Out</Text>
          
        </View>
      </TouchableOpacity>

      
    </View>
  );
};

export default HomeScreen;
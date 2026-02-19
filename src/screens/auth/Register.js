import { Text, View, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ROUTES } from '../../utils';

const Register = () => {
    const navigation = useNavigation();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Register</Text>
                  <View
                  style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
              }}
            >
              <Text>Already have an account?</Text>
              <TouchableOpacity onPress={() => navigation.navigate(ROUTES.LOGIN)}>
                <Text style={{ color: 'red', marginLeft: 10, fontWeight: 'bold' }}>
                  Login
                </Text>
              </TouchableOpacity>
            </View>
    </View>
  );
};

export default Register;
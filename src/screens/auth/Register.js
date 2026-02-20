import { useState } from 'react';
import { 
  Alert, 
  Text, 
  TouchableOpacity, 
  View, 
  Image, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  Dimensions
} from 'react-native';

import { useNavigation, useRoute,} from '@react-navigation/native';
import CustomButton from '../../components/CustomButton';
import CustomTextInput from '../../components/CustomTextInput';
import { IMG, ROUTES } from '../../utils';

const { width } = Dimensions.get('window');

const Login = () => {
  const [emailAdd, setEmailAdd] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setphoneNumber] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [confirmpassword, setConfirmPassword] = useState('');

  const navigation = useNavigation();
  const route = useRoute();
  const { setIsLoggedIn } = route.params || {};

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: '#f5f5f5' }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={{
            flex: 1,
            padding: 25,
            justifyContent: 'center',
          }}
        >
          {/* Header Section with Logo/Icon */}
          <View style={{ alignItems: 'center', marginBottom: 40 }}>
            <Text
              style={{
                fontSize: 28,
                fontWeight: 'bold',
                color: '#333',
                marginBottom: 5,
              }}
            >
              Create Account!
            </Text>
            <Text style={{ fontSize: 16, color: '#666' }}>
              Fill out the fields to continue
            </Text>
          </View>

          {/* Form Section */}
          <View style={{ width: '100%' }}>
            <CustomTextInput
              label={'Email Address'}
              placeholder={'Enter your email'}
              value={val => setEmailAdd(val)}
              containerStyle={{
                marginBottom: 15,
                backgroundColor: 'white',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#e0e0e0',
                paddingHorizontal: 5,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 3,
                elevation: 2,
              }}
              textStyle={{
                borderRadius: 10,
                color: '#333',
                marginLeft: 10,
                fontSize: 16,
                paddingVertical: 12,
              }}
              labelStyle={{
                fontSize: 14,
                fontWeight: '600',
                color: '#555',
                marginBottom: 5,
                marginLeft: 5,
              }}
            />

            <CustomTextInput
              label={'Phone Number'}
              placeholder={'Enter your phone number'}
              value={val => setphoneNumber(val)}
              containerStyle={{
                marginBottom: 15,
                backgroundColor: 'white',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#e0e0e0',
                paddingHorizontal: 5,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 3,
                elevation: 2,
              }}
              textStyle={{
                borderRadius: 10,
                color: '#333',
                marginLeft: 10,
                fontSize: 16,
                paddingVertical: 12,
              }}
              labelStyle={{
                fontSize: 14,
                fontWeight: '600',
                color: '#555',
                marginBottom: 5,
                marginLeft: 5,
              }}
            />

            <CustomTextInput
              label={'Birthdate'}
              placeholder={'MM/DD/YY'}
              value={val => setBirthdate(val)}
              containerStyle={{
                marginBottom: 15,
                backgroundColor: 'white',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#e0e0e0',
                paddingHorizontal: 5,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 3,
                elevation: 2,
              }}
              textStyle={{
                borderRadius: 10,
                color: '#333',
                marginLeft: 10,
                fontSize: 16,
                paddingVertical: 12,
              }}
              labelStyle={{
                fontSize: 14,
                fontWeight: '600',
                color: '#555',
                marginBottom: 5,
                marginLeft: 5,
              }}
            />

            <CustomTextInput
              label={'Password'}
              placeholder={'Enter your password'}
              value={val => setPassword(val)}
              containerStyle={{
                marginBottom: 10,
                backgroundColor: 'white',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#e0e0e0',
                paddingHorizontal: 5,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 3,
                elevation: 2,
              }}
              textStyle={{
                borderRadius: 10,
                color: '#333',
                marginLeft: 10,
                fontSize: 16,
                paddingVertical: 12,
              }}
              labelStyle={{
                fontSize: 14,
                fontWeight: '600',
                color: '#555',
                marginBottom: 5,
                marginLeft: 5,
              }}
            />

            <CustomTextInput
              label={'Confirm Password'}
              placeholder={'Please confirm your password'}
              value={val => setConfirmPassword(val)}
              containerStyle={{
                marginBottom: 15,
                backgroundColor: 'white',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#e0e0e0',
                paddingHorizontal: 5,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 3,
                elevation: 2,
              }}
              textStyle={{
                borderRadius: 10,
                color: '#333',
                marginLeft: 10,
                fontSize: 16,
                paddingVertical: 12,
              }}
              labelStyle={{
                fontSize: 14,
                fontWeight: '600',
                color: '#555',
                marginBottom: 5,
                marginLeft: 5,
              }}
            />
          </View>

          {/* Login Button */}
          <CustomButton
            label={'Create Account'}
            containerStyle={{
              backgroundColor: '#4A90E2',
              borderRadius: 12,
              marginVertical: 20,
              width: '100%',
              paddingVertical: 5,
              shadowColor: '#4A90E2',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 5,
              elevation: 5,
            }}
            textStyle={{
              color: 'white',
              fontWeight: 'bold',
              fontSize: 18,
              paddingVertical: 10,
            }}
            onPress={() => {
              if (emailAdd === 'admin' && password === 'password' && phoneNumber === '1234567890' && birthdate === '01/01/2000' && confirmpassword === 'password') {
                Alert.alert(
                  'Account created successfully!',
                  'Continue to login.',
                  [
                    {
                      text: 'Continue',
                      onPress: () => {
                        if (setIsLoggedIn) {
                          setIsLoggedIn(true);
                        }
                      },
                      style: 'default',
                    },
                  ],
                );
              } else {
                Alert.alert(
                  'Please input required fields',
                  'Complete the required fields',
                  [{ text: 'Try Again' }],
                );
              }
            }}
          />
          {/* Register Link */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 20,
              marginBottom: 10,
            }}
          >
            <Text style={{ color: '#666', fontSize: 15 }}>
              Already Have an Account?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate(ROUTES.LOGIN)}>
              <Text
                style={{
                  color: '#4A90E2',
                  fontWeight: 'bold',
                  fontSize: 16,
                }}
              >
                Login
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default Login;
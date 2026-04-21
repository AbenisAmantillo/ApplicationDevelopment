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
  const { setIsLoggedIn } = (route.params as any) || {};


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
              value={emailAdd}
              onChangeText={(val: string) => setEmailAdd(val)}
              containerStyle={{
                marginBottom: 15,
                backgroundColor: 'white',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#e0e0e0',
                paddingHorizontal: 5,
              }}
              textStyle={{
                borderRadius: 10,
                color: '#333',
                marginLeft: 10,
                fontSize: 16,
                paddingVertical: 12,
              }}
            />

            <CustomTextInput
              label={'Phone Number'}
              placeholder={'Enter your phone number'}
              value={phoneNumber}
              onChangeText={(val: string) => setphoneNumber(val)}
              containerStyle={{
                marginBottom: 15,
                backgroundColor: 'white',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#e0e0e0',
                paddingHorizontal: 5,
              }}
              textStyle={{
                borderRadius: 10,
                color: '#333',
                marginLeft: 10,
                fontSize: 16,
                paddingVertical: 12,
              }}
            />

            <CustomTextInput
              label={'Birthdate'}
              placeholder={'MM/DD/YYYY'}
              value={birthdate}
              onChangeText={(val: string) => setBirthdate(val)}
              containerStyle={{
                marginBottom: 15,
                backgroundColor: 'white',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#e0e0e0',
                paddingHorizontal: 5,
              }}
              textStyle={{
                borderRadius: 10,
                color: '#333',
                marginLeft: 10,
                fontSize: 16,
                paddingVertical: 12,
              }}
            />

            <CustomTextInput
              label={'Password'}
              placeholder={'Enter your password'}
              value={password}
              onChangeText={(val: string) => setPassword(val)}
              containerStyle={{
                marginBottom: 15,
                backgroundColor: 'white',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#e0e0e0',
                paddingHorizontal: 5,
              }}
              textStyle={{
                borderRadius: 10,
                color: '#333',
                marginLeft: 10,
                fontSize: 16,
                paddingVertical: 12,
              }}
            />

            <CustomTextInput
              label={'Confirm Password'}
              placeholder={'Confirm your password'}
              value={confirmpassword}
              onChangeText={(val: string) => setConfirmPassword(val)}
              containerStyle={{
                marginBottom: 20,
                backgroundColor: 'white',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#e0e0e0',
                paddingHorizontal: 5,
              }}
              textStyle={{
                borderRadius: 10,
                color: '#333',
                marginLeft: 10,
                fontSize: 16,
                paddingVertical: 12,
              }}
            />
          </View>

          {/* Buttons */}
          <CustomButton
            label={'CREATE ACCOUNT'}
            containerStyle={{
              backgroundColor: '#1E3A8A',
              borderRadius: 10,
              marginVertical: 10,
              width: '100%',
            }}
            textStyle={{
              color: 'white',
              fontWeight: 'bold',
              fontSize: 16,
            }}
            onPress={() => {
              Alert.alert('Account Created', 'Your account has been created successfully');
            }}
          />

          <TouchableOpacity
            onPress={() => (navigation as any).navigate(ROUTES.LOGIN)}
            style={{
              marginVertical: 10,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#1E3A8A', fontWeight: 'bold', fontSize: 14 }}>
              Already have an account? Login
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default Login;

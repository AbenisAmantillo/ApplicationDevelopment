import React, { useState } from 'react';
import { Text, View, Button } from 'react-native';
import CustomeTextInput from '../../components/CustomTextInput';
import { useNavigation } from '@react-navigation/native';
import { ROUTES } from '../../utils';
import CustomButton from '../../components/CustomButton';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const navigation = useNavigation();

    return (
        <View
        style={{
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            height: '100%',
            paddingHorizontal: 20,
        }}
        >

        <CustomeTextInput
            label="Username"
            placeholder="Enter your username"
            onChangeText={setUsername}
            textStyle={{ color: 'black', marginBottom: 4 }}
            TextInputStyle={{
            width: '100%',
            borderRadius: 20,
            borderWidth: 1,
            borderColor: 'gray',
            paddingHorizontal: 10,
            paddingVertical: 8,
            marginBottom: 16,
            }}
        />

        <CustomeTextInput
            label="Password"
            placeholder="Enter your password"
            onChangeText={setPassword}
            textStyle={{ color: 'black', marginBottom: 4 }}
            TextInputStyle={{
            width: '100%',
            borderRadius: 20,
            borderWidth: 1,
            borderColor: 'gray',
            paddingHorizontal: 10,
            paddingVertical: 8,
            marginBottom: 24,
            }}
        />

        <View
            style={{
            width: '100%',
            gap: 12,
            }}
        >
            <Button
            title="Go To Home"
            onPress={() => navigation.navigate(ROUTES.HOME)}
            />

            <Button
            title="Go To Profile"
            onPress={() => navigation.navigate(ROUTES.PROFILE)}
            />

            <CustomButton
            label="Home"
            mainStyle={{
                marginTop: 12,
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 10,
                backgroundColor: 'green',
            }}
            route={ROUTES.HOME}
            />
        </View>
        </View>
    );
}
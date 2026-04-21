import { useState, useEffect } from 'react';
import { Image, Alert, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';

import CustomButton from '../../components/CustomButton';
import CustomTextInput from '../../components/CustomTextInput';
import { IMG, ROUTES, } from '../../utils';
import { authLogin } from '../../app/action';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const navigation = useNavigation();
    const dispatch = useDispatch();
    const auth = useSelector((state: any) => state.auth);

    useEffect(() => {
        if (!auth.isLoading && auth.isError && auth.error) {
            (navigation as any).navigate(ROUTES.ERROR)
        }
    }, [navigation]);

    return (
        <View
        style={{
            flex: 1,
            padding: 20,
            alignItems: 'center',
            justifyContent: 'center',
            // backgroundColor: 'gray',
        }}
        >
        <Image
            source={IMG.LOGO}
            style={{ width: 320, height: 200 }}
            resizeMode="contain"
        />

        <View style={{ width: '100%' }}>
            <CustomTextInput
            label={'Username'}
            placeholder={'Enter Username'}
            value={username}
            onChangeText={(val: string) => setUsername(val)}
            containerStyle={{
                padding: 5,
            }}
            textStyle={{
                borderRadius: 10,
                color: 'black',
                marginLeft: 10,
                fontWeight: 'bold',
            }}
            />
            <CustomTextInput
            label={'Password'}
            placeholder={'Enter Password'}
            value={password}
            onChangeText={(val: string) => setPassword(val)}
            containerStyle={{
                padding: 5,
            }}
            textStyle={{
                borderRadius: 10,
                color: 'black',
                marginLeft: 10,
                fontWeight: 'bold',
            }}
            />
        </View>

        <CustomButton
            label={'LOGIN'}
            containerStyle={{
            backgroundColor: '#1E3A8A',
            borderRadius: 10,
            marginVertical: 20,
            width: '85%',
            }}
            textStyle={{
            color: 'white',
            fontWeight: 'bold',
            }}
            onPress={() => {
            if (username === '' || password === '') {
                Alert.alert(
                'Invalid Credentials',
                'Please enter valid userame and password',
                );
                return;
            }

            dispatch(
                authLogin({
                username,
                password,
                }),
            );
            }}
        />
        </View>
    );
};

export default Login;

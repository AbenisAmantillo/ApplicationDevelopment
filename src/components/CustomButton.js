import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function CustomButton({ label, mainStyle, route }) {
    const navigation = useNavigation();

    return (
        <TouchableOpacity
        style={mainStyle}
        onPress={() => route && navigation.navigate(route)}
        >
        <Text>{label}</Text>
        </TouchableOpacity>
    );
}
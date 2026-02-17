import React from 'react';
import { Text, TextInput, View } from 'react-native';

export default function CustomTextInput({
    label,
    placeholder,
    onChangeText,
    textStyle,
    TextInputStyle,
    }) {
    return (
        <View>
        <Text style={textStyle}>{label}</Text>
        <TextInput
            placeholder={placeholder}
            placeholderTextColor="gray"
            onChangeText={onChangeText}
            style={TextInputStyle}
        />
        </View>
    );
}
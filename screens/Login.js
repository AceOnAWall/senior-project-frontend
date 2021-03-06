import React, { useState } from 'react';
import { Button, View, Text, TextInput, Image, StyleSheet } from 'react-native';
import validator from 'validator';

function Login() {
  const [value, onChangeUserText] = useState('');
  const [password, onChangePasswordText] = useState('');
  if (validator.isEmpty(Login.[value, onChangeUserText]) || validator.isEmpty(Login.[password, onChangePasswordText])) {
    console.log('User Name or Password field is empty');
  }
  if (!validator.isAlphanumeric([value, onChangeUserText]) || !validator.isAlphanumeric([password, onChangePasswordText])) {
    console.log('Please use standard Enlgish characters and numbers only');
  }

  // really basic HTTP request to the EC instance I got going
  const submitInfo = async () => {
    const url = "http://ec2-3-83-108-10.compute-1.amazonaws.com:3000/";
    try {
      let response = await fetch(url);
      let fetchData = await response.text();
      console.log(fetchData);
      return fetchData;
    } catch (error) {
      console.log("Server is probably not running if you're seeing error");
      console.error(error);
    }
  }

  return (
    <View style={{ flex: 1, flexDirection: 'column', justifyContent: "space-between", paddingTop: 25}}>

      <Text style={{ flex: .5, alignItems: "center", textAlign: "center", fontSize: 50 }}>Snap & Go</Text>

      <Image
        style={styles.placeholderImage}
        source={{
          uri: 'https://reactnative.dev/img/tiny_logo.png',
        }}
      />


      <View style={{ flex: 1, flexDirection: "column", alignItems: "center" }}>
        <TextInput
          focus
          autoCompleteType={"username"}
          style={styles.textBox}
          onChangeText={text => onChangeUserText(text)}
          value={value}
          placeholder={'Username'}
        />

        <TextInput
          secureTextEntry
          style={styles.textBox}
          onChangeText={text => onChangePasswordText(text)}
          value={password}
          placeholder={'Password'}
        />
      </View>
      <View style={{ flex: .5 }}>
        <Button
          title="Login"
          onPress={submitInfo}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  placeholderImage: {
    flex: 2,
    marginTop: 10,
    height: undefined,
    width: undefined,
    resizeMode: 'contain',
  },
  textBox: {
    height: 40,
    width: '90%',
    marginTop: 20,
    alignItems: 'center',
    borderColor: 'gray',
    borderWidth: 1
  },
});

export default Login;

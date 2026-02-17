import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { NavigationContainer } from '@react-navigation/native';
import Routes from './Routes/Routes';

const App = () => {
  return (
    <NavigationContainer>
   
      <Routes/>
    </NavigationContainer>
  )
}

export default App

const styles = StyleSheet.create({})  
import React from 'react'
import Home from '../Screens/Home'
import Detail from '../Screens/Detail'
import Splash from '../Screens/Splash'
import Shalat from '../Screens/Shalat'
import Qiblat from '../Screens/Qiblat'
import Quran from '../Screens/Quran'
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

const Routes = () => {
  return (

    <Stack.Navigator initialRouteName='Splash'>
      <Stack.Screen name="Splash" component={Splash} options={{headerShown:false}} />
      <Stack.Screen name="Home" component={Home} options={{headerShown:false}} />
      <Stack.Screen name="Shalat" component={Shalat} options={{headerShown:false}} />
      <Stack.Screen name="Qiblat" component={Qiblat} options={{headerShown:false}} />
      <Stack.Screen name="Quran" component={Quran} options={{headerShown:false}} />
      <Stack.Screen name="Detail" component={Detail} options={{headerShown:false}} />
    </Stack.Navigator>
  
  )
}

export default Routes


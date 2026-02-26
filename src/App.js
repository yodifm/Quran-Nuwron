import { NavigationContainer } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withDelay, withSequence, withTiming } from 'react-native-reanimated';
import Routes from './Routes/Routes';

SplashScreen.preventAutoHideAsync();

const App = () => {
  const [splashVisible, setSplashVisible] = useState(true);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(0.9);

  useEffect(() => {
    const run = async () => {
      await new Promise((r) => setTimeout(r, 150));
      await SplashScreen.hideAsync();
      scale.value = withSequence(withTiming(1.08, { duration: 280 }), withTiming(1, { duration: 220 }));
      opacity.value = withDelay(350, withTiming(0, { duration: 300 }, () => {
        runOnJS(setSplashVisible)(false);
      }));
    };
    run();
  }, [opacity, scale]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <>
      <NavigationContainer>
        <Routes/>
      </NavigationContainer>
      {splashVisible && (
        <Animated.View style={[StyleSheet.absoluteFill, styles.splashOverlay, overlayStyle]} />
      )}
    </>
  )
}

export default App

const styles = StyleSheet.create({
  splashOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
})  

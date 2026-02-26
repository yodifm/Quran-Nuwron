import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Detail from "../Screens/Detail";
import Doa from "../Screens/Doa";
import DoaDetail from "../Screens/DoaDetail";
import Game from "../Screens/Game";
import GameTebakAyat from "../Screens/GameTebakAyat";
import GameSambungAyat from "../Screens/GameSambungAyat";
import NearestMosque from "../Screens/NearestMosque";
import Home from "../Screens/Home";
import Qiblat from "../Screens/Qiblat";
import Quran from "../Screens/Quran";
import Shalat from "../Screens/Shalat";
import Splash from "../Screens/Splash";
import Tatacara from "../Screens/Tatacara";
import DzikirCounter from "../Screens/DzikirCounter";

const Stack = createNativeStackNavigator();

const Routes = () => {
  return (
    <Stack.Navigator initialRouteName="Splash">
      <Stack.Screen
        name="Splash"
        component={Splash}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Home"
        component={Home}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Shalat"
        component={Shalat}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Qiblat"
        component={Qiblat}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Quran"
        component={Quran}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Detail"
        component={Detail}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Doa"
        component={Doa}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="DoaDetail"
        component={DoaDetail}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Tatacara"
        component={Tatacara}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Game"
        component={Game}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="GameTebakAyat"
        component={GameTebakAyat}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="GameSambungAyat"
        component={GameSambungAyat}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="NearestMosque"
        component={NearestMosque}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="DzikirCounter"
        component={DzikirCounter}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default Routes;

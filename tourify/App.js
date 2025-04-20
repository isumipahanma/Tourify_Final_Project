import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import Login from './src/screen/Login'
import Register from './src/screen/register';
import Home from './src/screen/Home';
import TopDestinations from './src/screen/TopDestination';
import TabsScreen from './src/screen/TabScreen';
import ForgotPassword from './src/screen/ForgotPassowrd';
import Transport from './src/screen/Transport';
import Others from './src/screen/Others';
import Map from './src/screen/Map';
import Hotel from './src/screen/Hotel';
import HotelDetail from './src/screen/HotelDetail';
import DestinationDetail from './src/screen/DestinationDetail';
import AddHotelScreen from './src/screen/AddHotelScreen';
import AddRestaurantScreen from './src/screen/AddRestaurantScreen';
import Profile from './src/screen/profile';
import Notifications from './src/screen/Notification';

/*



import AddRestaurantScreen from './src/screen/AddRestaurantScreen';
import AddHotelScreen from './src/screen/AddHotelScreen';

import PlaceForm from './src/screen/PlaceForm';

import DestinationDetail from './src/screen/DestinationDetail';
import 'react-native-get-random-values';

*/





const Stack = createStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer fallback={<ActivityIndicator size="large" color="#ffe600" />}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="Register" component={Register} />
          <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
          <Stack.Screen name="Home" component={Home} />
          <Stack.Screen name="TabScreen" component={TabsScreen} />
          <Stack.Screen name="TopDestination" component={TopDestinations}/>
          <Stack.Screen name='Transport' component={Transport}/>
          <Stack.Screen name='Map' component={Map}/>
          <Stack.Screen name='Others' component={Others}/>
          <Stack.Screen name='Hotel' component={Hotel}/>
          <Stack.Screen name='HotelDetail' component={HotelDetail}/>
          <Stack.Screen name='DestinationDetail' component={DestinationDetail}/>
          <Stack.Screen name="AddHotelScreen" component={AddHotelScreen}/>
          <Stack.Screen name="AddRestaurantScreen" component={AddRestaurantScreen}/>
          <Stack.Screen name="Profile" component={Profile}/>
          <Stack.Screen name="Notifications" component={Notifications}/>
          
         
          
         
          

        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

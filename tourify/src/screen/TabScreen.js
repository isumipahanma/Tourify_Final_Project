import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import Home from './Home';
import Transport from './Transport';
import Map from './Map';
import Others from './Others';
import Hotel from './Hotel';

const Tab = createBottomTabNavigator();

const TabsScreen = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#007BFF',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          height: 60,
          padding: 5,
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#f0f0f0',
        },
        headerShown: false,
        tabBarHideOnKeyboard: true, // This is the key setting to hide tab bar on keyboard open
      }}
    >
      <Tab.Screen
        name="Home"
        component={Home}
        options={{
          tabBarIcon: ({ color, size }) => <Icon name="home" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Hotel"
        component={Hotel}
        options={{
          tabBarIcon: ({ color, size }) => <Icon name="hotel" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Map"
        component={Map}
        options={{
          tabBarIcon: ({ color, size }) => <Icon name="map-marker" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Transport"
        component={Transport}
        options={{
          tabBarIcon: ({ color, size }) => <Icon name="train" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Others"
        component={Others}
        options={{
          tabBarIcon: ({ color, size }) => <Icon name="ellipsis-h" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};

export default TabsScreen;
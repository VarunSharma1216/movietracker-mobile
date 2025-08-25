// src/App.js
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { MaterialIcons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';
import { supabase } from './supabase';

// Import screens
import Browse from './pages/Browse';
import Profile from './pages/Profile';
import MovieDetail from './pages/MovieDetail';
import SignIn from './components/auth/SignIn';
import SignUp from './components/auth/SignUp';
import AuthDetails from './components/AuthDetails';
import TVDetail from './pages/TVDetails';
import Home from './pages/Home';
import Friends from './pages/Friends';
import Settings from './pages/Settings';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack navigator for Browse section (includes movie/tv details)
const BrowseStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="BrowseMain" component={Browse} />
      <Stack.Screen name="MovieDetail" component={MovieDetail} />
      <Stack.Screen name="TVDetail" component={TVDetail} />
    </Stack.Navigator>
  );
};

// Stack navigator for Profile section
const ProfileStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={Profile} />
    </Stack.Navigator>
  );
};

// Stack navigator for Friends section
const FriendsStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="FriendsMain" component={Friends} />
    </Stack.Navigator>
  );
};

// Custom header component
const CustomHeader = ({ title }) => (
  <View style={styles.header}>
    <Text style={styles.headerTitle}>MovieTracker</Text>
  </View>
);

// Main tab navigator
const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Browse') {
            iconName = 'movie';
          } else if (route.name === 'Profile') {
            iconName = 'person';
          } else if (route.name === 'Friends') {
            iconName = 'people';
          } else if (route.name === 'Settings') {
            iconName = 'settings';
          }

          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#1890ff',
        tabBarInactiveTintColor: 'gray',
        header: () => <CustomHeader />,
        tabBarStyle: styles.tabBar,
      })}
    >
      <Tab.Screen name="Browse" component={BrowseStack} />
      <Tab.Screen name="Profile" component={ProfileStack} />
      <Tab.Screen name="Friends" component={FriendsStack} />
      <Tab.Screen name="Settings" component={Settings} />
    </Tab.Navigator>
  );
};

// Root stack navigator (includes auth screens)
const RootStack = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <Stack.Screen name="Main" component={MainTabs} />
      ) : (
        <>
          <Stack.Screen name="SignIn" component={SignIn} />
          <Stack.Screen name="SignUp" component={SignUp} />
        </>
      )}
      <Stack.Screen name="AuthDetails" component={AuthDetails} />
      <Stack.Screen name="Home" component={Home} />
    </Stack.Navigator>
  );
};

const App = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider>
        <NavigationContainer>
          <StatusBar style="light" />
          <RootStack />
        </NavigationContainer>
      </PaperProvider>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#434a54',
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 10,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  tabBar: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    height: 60,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f4f9',
  },
});

export default App;

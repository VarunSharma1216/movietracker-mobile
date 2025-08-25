import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
} from 'react-native';
import {
  Text,
  Title,
  Button,
  Card,
  Surface,
  ActivityIndicator,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../supabase';

const AuthDetails = () => {
  const [authUser, setAuthUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const navigation = useNavigation();

  useEffect(() => {
    loadAuthUser();
  }, []);

  const loadAuthUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setAuthUser(session?.user || null);
    } catch (error) {
      console.error('Error loading auth user:', error);
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigation.navigate('SignIn');
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Error', 'Failed to sign out');
    }
  };

  const handleContinue = () => {
    navigation.navigate('Main');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <Surface style={styles.container}>
      <View style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.title}>Authentication Details</Title>
            
            {authUser ? (
              <View>
                <Text style={styles.infoText}>
                  You are currently signed in as:
                </Text>
                <Text style={styles.emailText}>
                  {authUser.email}
                </Text>
                <Text style={styles.infoText}>
                  User ID: {authUser.id}
                </Text>
                
                <View style={styles.buttonContainer}>
                  <Button
                    mode="contained"
                    onPress={handleContinue}
                    style={styles.button}
                  >
                    Continue to App
                  </Button>
                  
                  <Button
                    mode="outlined"
                    onPress={handleSignOut}
                    style={styles.button}
                  >
                    Sign Out
                  </Button>
                </View>
              </View>
            ) : (
              <View>
                <Text style={styles.infoText}>
                  You are not currently signed in.
                </Text>
                
                <View style={styles.buttonContainer}>
                  <Button
                    mode="contained"
                    onPress={() => navigation.navigate('SignIn')}
                    style={styles.button}
                  >
                    Go to Sign In
                  </Button>
                </View>
              </View>
            )}
          </Card.Content>
        </Card>
      </View>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  infoText: {
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emailText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
    textAlign: 'center',
    marginBottom: 12,
  },
  buttonContainer: {
    marginTop: 20,
  },
  button: {
    marginVertical: 8,
  },
});

export default AuthDetails;
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import {
  TextInput,
  Button,
  Title,
  Text,
  Card,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { supabase } from "../../supabase";

const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        Alert.alert('Error', `Error signing in: ${error.message}`);
        setLoading(false);
        return;
      }

      Alert.alert('Success', 'Successfully signed in!');
      console.log('Signed in:', data.user);
      
      // Get username to redirect to correct profile
      try {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('username')
          .eq('id', data.user.id)
          .single();
          
        if (!userError && userData?.username) {
          // Navigate to the main app - profile will be handled by tab navigation
          navigation.navigate('Main');
        } else {
          console.warn('Username not found, navigating to main app');
          navigation.navigate('Main');
        }
      } catch (userFetchError) {
        console.error('Error fetching username:', userFetchError);
        navigation.navigate('Main');
      }
    } catch (error) {
      Alert.alert('Error', `Error signing in: ${error.message}`);
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.title}>Login</Title>
            
            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              mode="outlined"
            />
            
            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={styles.input}
              mode="outlined"
            />
            
            <Button
              mode="contained"
              onPress={handleSignIn}
              loading={loading}
              disabled={loading}
              style={styles.button}
            >
              Log In
            </Button>
            
            <View style={styles.linkContainer}>
              <Text>Don't have an account? </Text>
              <Text
                style={styles.link}
                onPress={() => navigation.navigate('SignUp')}
              >
                Create one
              </Text>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    elevation: 4,
    borderRadius: 8,
  },
  title: {
    textAlign: 'center',
    marginBottom: 30,
    fontSize: 24,
    fontWeight: 'bold',
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 16,
    marginBottom: 20,
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  link: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
});

export default SignIn;

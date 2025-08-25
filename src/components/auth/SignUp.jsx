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

const SignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigation = useNavigation();

  // Function to check if username already exists
  const checkUsernameExists = async (username) => {
    if (!username) {
      console.log('No username provided');
      return false;
    }
  
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('username', username.toLowerCase())
        .single();
  
      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
        console.error('Error checking username:', error);
        return false;
      }
  
      return data !== null;
    } catch (error) {
      console.error('Error checking username:', error);
      return false;
    }
  };
  

  const handleSignUp = async () => {
    console.log('=== SIGNUP PROCESS STARTED ===');
    console.log('Form data:', { username, email, password: '***' });

    // Basic validation
    if (!username || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (username.length < 3) {
      Alert.alert('Error', 'Username must be at least 3 characters long');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      Alert.alert('Error', 'Username can only contain letters, numbers and underscores');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      console.log('❌ Password mismatch');
      Alert.alert('Error', 'Passwords do not match!');
      return;
    }

    try {
      setIsSubmitting(true);
      console.log('🔄 Setting isSubmitting to true');

      // Check username availability one last time before creating account
      console.log('🔍 Checking username availability...');
      const usernameExists = await checkUsernameExists(username);
      console.log('Username exists check result:', usernameExists);
      
      if (usernameExists) {
        console.log('❌ Username already taken');
        Alert.alert('Error', 'Username already taken. Please choose another one.');
        return;
      }

      // Create user in Supabase Auth
      console.log('🚀 Creating user in Supabase Auth...');
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username.toLowerCase()
          }
        }
      });

      console.log('Supabase Auth Response:', { data, error });

      if (error) {
        console.log('❌ Supabase Auth Error:', error);
        Alert.alert('Error', `Error signing up: ${error.message}`);
        return;
      }

      console.log('✅ Auth user created successfully');
      console.log('User data:', data.user);

      // Create user profile record
      if (data.user) {
        console.log('👤 Creating user profile record...');
        try {
          const profileData = {
            id: data.user.id,
            username: username.toLowerCase(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          console.log('Profile data to insert:', profileData);
          
          const { error: profileError } = await supabase
            .from('users')
            .insert(profileData);

          if (profileError) {
            console.log('❌ Profile creation error:', profileError);
          } else {
            console.log('✅ User profile created successfully');
          }
        } catch (profileError) {
          console.log('❌ Profile creation exception:', profileError);
        }
      } else {
        console.log('⚠️ No user data returned from auth signup');
      }

      console.log('✅ SIGNUP PROCESS COMPLETED');
      Alert.alert('Success', 'Account created successfully! You can now log in.');
      
      // Reset form
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setUsername('');
      
      // Navigate to sign in
      navigation.navigate('SignIn');
    } catch (error) {
      console.log('❌ SIGNUP PROCESS FAILED:', error);
      Alert.alert('Error', `Error signing up: ${error.message}`);
    } finally {
      setIsSubmitting(false);
      console.log('🔄 Setting isSubmitting to false');
      console.log('=== SIGNUP PROCESS ENDED ===');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.title}>Create an Account</Title>
            
            <TextInput
              label="Username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              style={styles.input}
              mode="outlined"
            />
            
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
            
            <TextInput
              label="Re-enter Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              style={styles.input}
              mode="outlined"
            />
            
            <Button
              mode="contained"
              onPress={handleSignUp}
              loading={isSubmitting}
              disabled={isSubmitting}
              style={styles.button}
            >
              Sign Up
            </Button>
            
            <View style={styles.linkContainer}>
              <Text>Already have an account? </Text>
              <Text
                style={styles.link}
                onPress={() => navigation.navigate('SignIn')}
              >
                Sign In
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

export default SignUp;
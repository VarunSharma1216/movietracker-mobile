import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Text,
  Title,
  Card,
  Button,
  Surface,
  Switch,
  List,
  Divider,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../supabase';

const Settings = () => {
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [autoSync, setAutoSync] = useState(true);

  const navigation = useNavigation();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        navigation.navigate('SignIn');
        return;
      }
      setUser(user);
    } catch (error) {
      console.error('Error loading user:', error);
      navigation.navigate('SignIn');
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            const { error } = await supabase.auth.signOut();
            if (error) {
              Alert.alert("Error", "Failed to sign out");
            } else {
              navigation.navigate('SignIn');
            }
          }
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This action cannot be undone. Are you sure you want to delete your account?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Alert.alert("Feature Coming Soon", "Account deletion will be available in a future update.");
          }
        }
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert("Feature Coming Soon", "Data export will be available in a future update.");
  };

  const handleResetPassword = () => {
    Alert.alert(
      "Reset Password",
      "A password reset email will be sent to your registered email address.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Send Email",
          onPress: async () => {
            if (!user?.email) return;
            
            const { error } = await supabase.auth.resetPasswordForEmail(user.email);
            if (error) {
              Alert.alert("Error", "Failed to send reset email");
            } else {
              Alert.alert("Success", "Password reset email sent!");
            }
          }
        }
      ]
    );
  };

  return (
    <Surface style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Title style={styles.headerTitle}>Settings</Title>

        {/* Account Section */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Account</Title>
            <List.Item
              title="Email"
              description={user?.email || 'Not available'}
              left={(props) => <List.Icon {...props} icon="email" />}
            />
            <List.Item
              title="Reset Password"
              description="Change your account password"
              left={(props) => <List.Icon {...props} icon="lock-reset" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={handleResetPassword}
            />
          </Card.Content>
        </Card>

        {/* Preferences Section */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Preferences</Title>
            <List.Item
              title="Notifications"
              description="Receive push notifications"
              left={(props) => <List.Icon {...props} icon="bell" />}
              right={() => (
                <Switch
                  value={notifications}
                  onValueChange={setNotifications}
                />
              )}
            />
            <List.Item
              title="Dark Mode"
              description="Use dark theme"
              left={(props) => <List.Icon {...props} icon="theme-light-dark" />}
              right={() => (
                <Switch
                  value={darkMode}
                  onValueChange={setDarkMode}
                />
              )}
            />
            <List.Item
              title="Auto Sync"
              description="Automatically sync your data"
              left={(props) => <List.Icon {...props} icon="sync" />}
              right={() => (
                <Switch
                  value={autoSync}
                  onValueChange={setAutoSync}
                />
              )}
            />
          </Card.Content>
        </Card>

        {/* Data Section */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Data</Title>
            <List.Item
              title="Export Data"
              description="Download your data"
              left={(props) => <List.Icon {...props} icon="download" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={handleExportData}
            />
          </Card.Content>
        </Card>

        {/* About Section */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>About</Title>
            <List.Item
              title="Version"
              description="1.0.0"
              left={(props) => <List.Icon {...props} icon="information" />}
            />
            <List.Item
              title="Privacy Policy"
              description="Read our privacy policy"
              left={(props) => <List.Icon {...props} icon="shield-account" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => Alert.alert("Coming Soon", "Privacy policy will be available soon.")}
            />
            <List.Item
              title="Terms of Service"
              description="Read our terms"
              left={(props) => <List.Icon {...props} icon="file-document" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => Alert.alert("Coming Soon", "Terms of service will be available soon.")}
            />
          </Card.Content>
        </Card>

        {/* Danger Zone */}
        <Card style={[styles.card, styles.dangerCard]}>
          <Card.Content>
            <Title style={[styles.sectionTitle, styles.dangerTitle]}>Danger Zone</Title>
            <View style={styles.buttonContainer}>
              <Button
                mode="outlined"
                onPress={handleSignOut}
                style={styles.dangerButton}
                textColor="#f44336"
              >
                Sign Out
              </Button>
              <Button
                mode="contained"
                onPress={handleDeleteAccount}
                style={[styles.dangerButton, styles.deleteButton]}
                buttonColor="#f44336"
              >
                Delete Account
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  dangerCard: {
    borderColor: '#f44336',
    borderWidth: 1,
  },
  dangerTitle: {
    color: '#f44336',
  },
  buttonContainer: {
    marginTop: 16,
  },
  dangerButton: {
    marginVertical: 4,
  },
  deleteButton: {
    marginTop: 8,
  },
});

export default Settings;
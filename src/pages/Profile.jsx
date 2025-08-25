import React, { useEffect, useState } from 'react';
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
  Avatar,
  Button,
  Surface,
  ActivityIndicator,
} from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { supabase } from '../supabase';

const Profile = () => {
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [movieCount, setMovieCount] = useState(0);
  const [tvCount, setTvCount] = useState(0);

  const navigation = useNavigation();

  // Load user profile when screen focuses
  useFocusEffect(
    React.useCallback(() => {
      loadUserProfile();
    }, [])
  );

  const loadUserProfile = async () => {
    setLoading(true);
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.log("No authenticated user:", userError);
        navigation.navigate('SignIn');
        return;
      }

      setCurrentUser(user);

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        console.log("No profile found:", profileError);
        // User exists but no profile - navigate to auth details
        navigation.navigate('AuthDetails');
        return;
      }

      setUserProfile(profile);

      // Get movie and TV counts (simplified - you can expand this)
      await loadUserStats(user.id);

    } catch (error) {
      console.error("Error loading profile:", error);
      Alert.alert("Error", "Failed to load profile");
    }
    setLoading(false);
  };

  const loadUserStats = async (userId) => {
    try {
      // These would need to be updated based on your actual database schema
      // For now, just setting placeholder values
      setMovieCount(0);
      setTvCount(0);
    } catch (error) {
      console.error("Error loading user stats:", error);
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!userProfile) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Profile not found</Text>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('SignIn')}
          style={styles.button}
        >
          Go to Sign In
        </Button>
      </View>
    );
  }

  return (
    <Surface style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Header */}
        <Card style={styles.profileCard}>
          <Card.Content style={styles.profileContent}>
            <Avatar.Text 
              size={80} 
              label={userProfile.username?.charAt(0).toUpperCase() || 'U'} 
              style={styles.avatar}
            />
            <Title style={styles.username}>@{userProfile.username}</Title>
            <Text style={styles.email}>{currentUser?.email}</Text>
          </Card.Content>
        </Card>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Title style={styles.statNumber}>{movieCount}</Title>
              <Text style={styles.statLabel}>Movies</Text>
            </Card.Content>
          </Card>
          
          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Title style={styles.statNumber}>{tvCount}</Title>
              <Text style={styles.statLabel}>TV Shows</Text>
            </Card.Content>
          </Card>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Button
            mode="outlined"
            onPress={() => navigation.navigate('Settings')}
            style={styles.button}
          >
            Settings
          </Button>
          
          <Button
            mode="contained"
            onPress={handleSignOut}
            style={[styles.button, styles.signOutButton]}
            buttonColor="#f44336"
          >
            Sign Out
          </Button>
        </View>

        {/* Quick Stats */}
        <Card style={styles.infoCard}>
          <Card.Content>
            <Title>Profile Information</Title>
            <Text style={styles.infoText}>
              Member since: {userProfile.created_at ? 
                new Date(userProfile.created_at).toLocaleDateString() : 'N/A'}
            </Text>
            <Text style={styles.infoText}>
              User ID: {userProfile.id}
            </Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  profileCard: {
    marginBottom: 16,
    elevation: 4,
  },
  profileContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  avatar: {
    marginBottom: 16,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  email: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 8,
    elevation: 2,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  buttonContainer: {
    marginBottom: 16,
  },
  button: {
    marginVertical: 8,
  },
  signOutButton: {
    marginTop: 16,
  },
  infoCard: {
    elevation: 2,
  },
  infoText: {
    fontSize: 14,
    marginVertical: 4,
    color: '#666',
  },
});

export default Profile;
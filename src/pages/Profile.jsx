import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import {
  Text,
  Title,
  Card,
  Avatar,
  Button,
  Surface,
  ActivityIndicator,
  SegmentedButtons,
  Chip,
} from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { supabase } from '../supabase';
import Constants from 'expo-constants';

const { width } = Dimensions.get('window');
const POSTER_BASE_URL = "https://image.tmdb.org/t/p/w300";
const API_KEY = Constants.expoConfig?.extra?.tmdbApiKey;

const Profile = () => {
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [movieCount, setMovieCount] = useState(0);
  const [tvCount, setTvCount] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  const [watchlistMovies, setWatchlistMovies] = useState([]);
  const [watchlistTV, setWatchlistTV] = useState([]);
  const [watchlistLoading, setWatchlistLoading] = useState(false);

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
      // Load movie watchlist count
      const { data: movieData, error: movieError } = await supabase
        .from('moviewatchlist')
        .select('id')
        .eq('user_id', userId);

      if (!movieError) {
        setMovieCount(movieData?.length || 0);
      }

      // Load TV watchlist count  
      const { data: tvData, error: tvError } = await supabase
        .from('tvwatchlist')
        .select('id')
        .eq('user_id', userId);

      if (!tvError) {
        setTvCount(tvData?.length || 0);
      }
    } catch (error) {
      console.error("Error loading user stats:", error);
    }
  };

  const loadWatchlistMovies = async (userId) => {
    setWatchlistLoading(true);
    try {
      const { data, error } = await supabase
        .from('moviewatchlist')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error && data) {
        setWatchlistMovies(data);
      }
    } catch (error) {
      console.error("Error loading movie watchlist:", error);
    }
    setWatchlistLoading(false);
  };

  const loadWatchlistTV = async (userId) => {
    setWatchlistLoading(true);
    try {
      const { data, error } = await supabase
        .from('tvwatchlist')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error && data) {
        setWatchlistTV(data);
      }
    } catch (error) {
      console.error("Error loading TV watchlist:", error);
    }
    setWatchlistLoading(false);
  };

  const handleTabChange = (value) => {
    setActiveTab(value);
    if (value === 'movies' && watchlistMovies.length === 0 && currentUser) {
      loadWatchlistMovies(currentUser.id);
    } else if (value === 'tv' && watchlistTV.length === 0 && currentUser) {
      loadWatchlistTV(currentUser.id);
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

  const renderWatchlistItem = ({ item, type }) => (
    <TouchableOpacity
      style={styles.watchlistItem}
      onPress={() => {
        if (type === 'movie') {
          navigation.navigate('MovieDetail', { movieId: item.tmdb_id });
        } else {
          navigation.navigate('TVDetail', { tvId: item.tmdb_id });
        }
      }}
    >
      <Image
        source={{ 
          uri: item.poster_path 
            ? `${POSTER_BASE_URL}${item.poster_path}` 
            : 'https://via.placeholder.com/300x450?text=No+Image'
        }}
        style={styles.watchlistPoster}
        resizeMode="cover"
      />
      <View style={styles.watchlistInfo}>
        <Text numberOfLines={2} style={styles.watchlistTitle}>
          {item.title || item.name}
        </Text>
        <Chip style={styles.statusChip} compact>
          {item.status || 'Planned'}
        </Chip>
        {item.rating && (
          <Text style={styles.watchlistRating}>
            ⭐ {item.rating}/10
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderOverviewTab = () => (
    <View>
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

      {/* Profile Info */}
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
    </View>
  );

  const renderWatchlistTab = (type) => (
    <View style={styles.watchlistContainer}>
      {watchlistLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading {type}s...</Text>
        </View>
      ) : (
        <FlatList
          data={type === 'movies' ? watchlistMovies : watchlistTV}
          renderItem={({ item }) => renderWatchlistItem({ item, type: type === 'movies' ? 'movie' : 'tv' })}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.watchlistList}
          columnWrapperStyle={styles.watchlistRow}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                No {type} in your watchlist yet.
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );

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
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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

        {/* Tab Navigation */}
        <SegmentedButtons
          value={activeTab}
          onValueChange={handleTabChange}
          buttons={[
            {
              value: 'overview',
              label: 'Overview',
              icon: 'account'
            },
            {
              value: 'movies',
              label: `Movies (${movieCount})`,
              icon: 'movie'
            },
            {
              value: 'tv',
              label: `TV (${tvCount})`,
              icon: 'television'
            },
          ]}
          style={styles.tabButtons}
        />

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'movies' && renderWatchlistTab('movies')}
          {activeTab === 'tv' && renderWatchlistTab('tv')}
        </View>
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
  tabButtons: {
    marginBottom: 16,
  },
  tabContent: {
    flex: 1,
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
  watchlistContainer: {
    flex: 1,
    minHeight: 400,
  },
  watchlistList: {
    padding: 8,
  },
  watchlistRow: {
    justifyContent: 'space-around',
  },
  watchlistItem: {
    width: (width - 50) / 2,
    marginBottom: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  watchlistPoster: {
    width: '100%',
    height: 200,
  },
  watchlistInfo: {
    padding: 12,
  },
  watchlistTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statusChip: {
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  watchlistRating: {
    fontSize: 12,
    color: '#666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default Profile;
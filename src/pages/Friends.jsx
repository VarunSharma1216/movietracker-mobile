import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
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
  Searchbar,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../supabase';

const Friends = () => {
  const [friends, setFriends] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const navigation = useNavigation();

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadFriends();
    }
  }, [currentUser]);

  const loadCurrentUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        navigation.navigate('SignIn');
        return;
      }
      setCurrentUser(user);
    } catch (error) {
      console.error('Error loading user:', error);
      navigation.navigate('SignIn');
    }
  };

  const loadFriends = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      // This is a simplified friends query - you'll need to adjust based on your schema
      const { data, error } = await supabase
        .from('users')
        .select('id, username, created_at')
        .limit(10); // Just show some users for demo

      if (error) {
        console.error('Error loading friends:', error);
        Alert.alert('Error', 'Failed to load friends');
      } else {
        setFriends(data || []);
      }
    } catch (error) {
      console.error('Error loading friends:', error);
      Alert.alert('Error', 'Failed to load friends');
    }
    setLoading(false);
  };

  const searchUsers = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, created_at')
        .ilike('username', `%${query}%`)
        .limit(10);

      if (error) {
        console.error('Error searching users:', error);
        Alert.alert('Error', 'Failed to search users');
      } else {
        setSearchResults(data || []);
      }
    } catch (error) {
      console.error('Error searching users:', error);
      Alert.alert('Error', 'Failed to search users');
    }
    setSearching(false);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    searchUsers(query);
  };

  const renderFriend = ({ item }) => (
    <Card style={styles.friendCard}>
      <Card.Content style={styles.friendContent}>
        <Avatar.Text 
          size={50} 
          label={item.username?.charAt(0).toUpperCase() || 'U'} 
          style={styles.avatar}
        />
        <View style={styles.friendInfo}>
          <Title style={styles.friendName}>@{item.username}</Title>
          <Text style={styles.friendDate}>
            Member since {item.created_at ? new Date(item.created_at).getFullYear() : 'N/A'}
          </Text>
        </View>
        <Button
          mode="outlined"
          onPress={() => {
            Alert.alert('Info', `You selected ${item.username}`);
          }}
          style={styles.friendButton}
        >
          View
        </Button>
      </Card.Content>
    </Card>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyText}>
        {searchQuery ? 'No users found' : 'No friends yet. Search for users to connect!'}
      </Text>
    </View>
  );

  return (
    <Surface style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.headerTitle}>Friends</Title>
        <Searchbar
          placeholder="Search users..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          onSubmitEditing={() => handleSearch(searchQuery)}
          style={styles.searchBar}
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading friends...</Text>
        </View>
      ) : (
        <FlatList
          data={searchQuery ? searchResults : friends}
          renderItem={renderFriend}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.friendsList}
          ListEmptyComponent={renderEmptyState}
        />
      )}

      {searching && (
        <View style={styles.searchingOverlay}>
          <ActivityIndicator size="small" />
        </View>
      )}
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: 'white',
    elevation: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  searchBar: {
    marginBottom: 8,
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
  friendsList: {
    padding: 16,
  },
  friendCard: {
    marginBottom: 12,
    elevation: 2,
  },
  friendContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  avatar: {
    marginRight: 12,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  friendDate: {
    fontSize: 12,
    color: '#666',
  },
  friendButton: {
    minWidth: 80,
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
  searchingOverlay: {
    position: 'absolute',
    top: 120,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 8,
    borderRadius: 20,
  },
});

export default Friends;
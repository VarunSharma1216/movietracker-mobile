import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from "react-native";
import {
  Searchbar,
  Card,
  Text,
  Title,
  Surface,
  Button,
} from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const POSTER_BASE_URL = "https://image.tmdb.org/t/p/w500";
const API_KEY = Constants.expoConfig?.extra?.tmdbApiKey;

const { width } = Dimensions.get('window');
const itemWidth = (width - 60) / 2; // Two items per row with margins

const Browse = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  const navigation = useNavigation();

  // Load popular movies on component mount
  useEffect(() => {
    loadPopularMovies();
    loadSearchQuery();
  }, []);

  const loadSearchQuery = async () => {
    try {
      const saved = await AsyncStorage.getItem("movieTracker_searchQuery");
      if (saved) {
        setSearchQuery(saved);
      }
    } catch (error) {
      console.warn("Could not load search query:", error);
    }
  };

  const saveSearchQuery = async (query) => {
    try {
      await AsyncStorage.setItem("movieTracker_searchQuery", query);
    } catch (error) {
      console.warn("Could not save search query:", error);
    }
  };

  const loadPopularMovies = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${TMDB_BASE_URL}/movie/popular?api_key=${API_KEY}&page=1`
      );
      const data = await response.json();
      setResults(data.results || []);
    } catch (error) {
      console.error("Error loading movies:", error);
      Alert.alert("Error", "Failed to load movies");
    }
    setLoading(false);
  };

  const searchMovies = async (query) => {
    if (!query.trim()) {
      loadPopularMovies();
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${TMDB_BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}`
      );
      const data = await response.json();
      setResults(data.results || []);
    } catch (error) {
      console.error("Error searching movies:", error);
      Alert.alert("Error", "Failed to search movies");
    }
    setLoading(false);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    saveSearchQuery(query);
    searchMovies(query);
  };

  const handleMoviePress = (movie) => {
    navigation.navigate('MovieDetail', { movieId: movie.id });
  };

  const renderMovieItem = ({ item }) => (
    <TouchableOpacity
      style={styles.movieItem}
      onPress={() => handleMoviePress(item)}
    >
      <Card style={styles.movieCard}>
        <Image
          source={{ 
            uri: item.poster_path 
              ? `${POSTER_BASE_URL}${item.poster_path}` 
              : 'https://via.placeholder.com/300x450?text=No+Image'
          }}
          style={styles.moviePoster}
          resizeMode="cover"
        />
        <Card.Content style={styles.movieContent}>
          <Title numberOfLines={2} style={styles.movieTitle}>
            {item.title}
          </Title>
          <Text numberOfLines={1} style={styles.movieYear}>
            {item.release_date ? new Date(item.release_date).getFullYear() : 'N/A'}
          </Text>
          <Text numberOfLines={1} style={styles.movieRating}>
            ⭐ {item.vote_average?.toFixed(1) || 'N/A'}
          </Text>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyText}>
        {searchQuery ? 'No movies found' : 'Start searching for movies!'}
      </Text>
    </View>
  );

  return (
    <Surface style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.headerTitle}>Browse Movies</Title>
        <Searchbar
          placeholder="Search movies..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          onSubmitEditing={() => handleSearch(searchQuery)}
          style={styles.searchBar}
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading movies...</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          renderItem={renderMovieItem}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.movieList}
          columnWrapperStyle={styles.row}
          ListEmptyComponent={renderEmptyState}
        />
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
  movieList: {
    padding: 16,
  },
  row: {
    justifyContent: 'space-between',
  },
  movieItem: {
    width: itemWidth,
    marginBottom: 16,
  },
  movieCard: {
    elevation: 4,
  },
  moviePoster: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  movieContent: {
    padding: 8,
    minHeight: 80,
  },
  movieTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  movieYear: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  movieRating: {
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

export default Browse;
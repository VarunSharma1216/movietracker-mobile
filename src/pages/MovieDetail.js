import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  Dimensions,
} from 'react-native';
import {
  Text,
  Title,
  Card,
  Button,
  Surface,
  ActivityIndicator,
  Chip,
} from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import Constants from 'expo-constants';

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const POSTER_BASE_URL = "https://image.tmdb.org/t/p/w500";
const BACKDROP_BASE_URL = "https://image.tmdb.org/t/p/w1280";
const API_KEY = Constants.expoConfig?.extra?.tmdbApiKey;

const { width } = Dimensions.get('window');

const MovieDetail = () => {
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const route = useRoute();
  const navigation = useNavigation();
  const { movieId } = route.params;

  useEffect(() => {
    loadMovieDetails();
  }, [movieId]);

  const loadMovieDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${TMDB_BASE_URL}/movie/${movieId}?api_key=${API_KEY}`
      );
      const data = await response.json();
      setMovie(data);
    } catch (error) {
      console.error('Error loading movie details:', error);
      Alert.alert('Error', 'Failed to load movie details');
    }
    setLoading(false);
  };

  const handleAddToWatchlist = () => {
    Alert.alert('Feature Coming Soon', 'Adding to watchlist will be available soon!');
  };

  const handleMarkAsWatched = () => {
    Alert.alert('Feature Coming Soon', 'Marking as watched will be available soon!');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading movie details...</Text>
      </View>
    );
  }

  if (!movie) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Movie not found</Text>
        <Button
          mode="contained"
          onPress={() => navigation.goBack()}
          style={styles.button}
        >
          Go Back
        </Button>
      </View>
    );
  }

  return (
    <Surface style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Backdrop Image */}
        {movie.backdrop_path && (
          <Image
            source={{ uri: `${BACKDROP_BASE_URL}${movie.backdrop_path}` }}
            style={styles.backdrop}
            resizeMode="cover"
          />
        )}

        {/* Movie Info Card */}
        <Card style={styles.movieCard}>
          <Card.Content style={styles.movieContent}>
            <View style={styles.movieHeader}>
              <Image
                source={{ 
                  uri: movie.poster_path 
                    ? `${POSTER_BASE_URL}${movie.poster_path}` 
                    : 'https://via.placeholder.com/300x450?text=No+Image'
                }}
                style={styles.poster}
                resizeMode="cover"
              />
              <View style={styles.movieInfo}>
                <Title style={styles.movieTitle}>{movie.title}</Title>
                <Text style={styles.movieYear}>
                  {movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'}
                </Text>
                <Text style={styles.movieRating}>
                  ⭐ {movie.vote_average?.toFixed(1) || 'N/A'} ({movie.vote_count} votes)
                </Text>
                <Text style={styles.movieRuntime}>
                  {movie.runtime ? `${movie.runtime} min` : 'Runtime N/A'}
                </Text>
              </View>
            </View>

            {/* Genres */}
            {movie.genres && movie.genres.length > 0 && (
              <View style={styles.genresContainer}>
                {movie.genres.map((genre) => (
                  <Chip key={genre.id} style={styles.genreChip}>
                    {genre.name}
                  </Chip>
                ))}
              </View>
            )}

            {/* Overview */}
            {movie.overview && (
              <View style={styles.overviewContainer}>
                <Title style={styles.sectionTitle}>Overview</Title>
                <Text style={styles.overview}>{movie.overview}</Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <Button
                mode="contained"
                onPress={handleAddToWatchlist}
                style={styles.actionButton}
              >
                Add to Watchlist
              </Button>
              <Button
                mode="outlined"
                onPress={handleMarkAsWatched}
                style={styles.actionButton}
              >
                Mark as Watched
              </Button>
            </View>

            {/* Additional Info */}
            <Card style={styles.infoCard}>
              <Card.Content>
                <Title style={styles.sectionTitle}>Details</Title>
                <Text style={styles.infoText}>
                  Status: {movie.status || 'N/A'}
                </Text>
                <Text style={styles.infoText}>
                  Budget: {movie.budget ? `$${movie.budget.toLocaleString()}` : 'N/A'}
                </Text>
                <Text style={styles.infoText}>
                  Revenue: {movie.revenue ? `$${movie.revenue.toLocaleString()}` : 'N/A'}
                </Text>
                <Text style={styles.infoText}>
                  Original Language: {movie.original_language?.toUpperCase() || 'N/A'}
                </Text>
              </Card.Content>
            </Card>
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
    paddingBottom: 20,
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
  backdrop: {
    width: width,
    height: 200,
  },
  movieCard: {
    margin: 16,
    elevation: 4,
  },
  movieContent: {
    padding: 16,
  },
  movieHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  poster: {
    width: 120,
    height: 180,
    borderRadius: 8,
    marginRight: 16,
  },
  movieInfo: {
    flex: 1,
  },
  movieTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  movieYear: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  movieRating: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  movieRuntime: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  genresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  genreChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  overviewContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  overview: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
  },
  buttonContainer: {
    marginBottom: 16,
  },
  actionButton: {
    marginVertical: 4,
  },
  button: {
    marginVertical: 8,
  },
  infoCard: {
    elevation: 2,
  },
  infoText: {
    fontSize: 14,
    marginVertical: 2,
    color: '#666',
  },
});

export default MovieDetail;
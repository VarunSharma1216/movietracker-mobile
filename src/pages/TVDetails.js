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

const TVDetails = () => {
  const [tvShow, setTvShow] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const route = useRoute();
  const navigation = useNavigation();
  const { tvId } = route.params;

  useEffect(() => {
    loadTvDetails();
  }, [tvId]);

  const loadTvDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${TMDB_BASE_URL}/tv/${tvId}?api_key=${API_KEY}`
      );
      const data = await response.json();
      setTvShow(data);
    } catch (error) {
      console.error('Error loading TV details:', error);
      Alert.alert('Error', 'Failed to load TV show details');
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
        <Text style={styles.loadingText}>Loading TV show details...</Text>
      </View>
    );
  }

  if (!tvShow) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>TV show not found</Text>
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
        {tvShow.backdrop_path && (
          <Image
            source={{ uri: `${BACKDROP_BASE_URL}${tvShow.backdrop_path}` }}
            style={styles.backdrop}
            resizeMode="cover"
          />
        )}

        {/* TV Show Info Card */}
        <Card style={styles.tvCard}>
          <Card.Content style={styles.tvContent}>
            <View style={styles.tvHeader}>
              <Image
                source={{ 
                  uri: tvShow.poster_path 
                    ? `${POSTER_BASE_URL}${tvShow.poster_path}` 
                    : 'https://via.placeholder.com/300x450?text=No+Image'
                }}
                style={styles.poster}
                resizeMode="cover"
              />
              <View style={styles.tvInfo}>
                <Title style={styles.tvTitle}>{tvShow.name}</Title>
                <Text style={styles.tvYear}>
                  {tvShow.first_air_date ? new Date(tvShow.first_air_date).getFullYear() : 'N/A'}
                </Text>
                <Text style={styles.tvRating}>
                  ⭐ {tvShow.vote_average?.toFixed(1) || 'N/A'} ({tvShow.vote_count} votes)
                </Text>
                <Text style={styles.tvSeasons}>
                  {tvShow.number_of_seasons} Season{tvShow.number_of_seasons !== 1 ? 's' : ''} • {tvShow.number_of_episodes} Episodes
                </Text>
                <Text style={styles.tvStatus}>
                  Status: {tvShow.status || 'N/A'}
                </Text>
              </View>
            </View>

            {/* Genres */}
            {tvShow.genres && tvShow.genres.length > 0 && (
              <View style={styles.genresContainer}>
                {tvShow.genres.map((genre) => (
                  <Chip key={genre.id} style={styles.genreChip}>
                    {genre.name}
                  </Chip>
                ))}
              </View>
            )}

            {/* Overview */}
            {tvShow.overview && (
              <View style={styles.overviewContainer}>
                <Title style={styles.sectionTitle}>Overview</Title>
                <Text style={styles.overview}>{tvShow.overview}</Text>
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
                  Original Name: {tvShow.original_name || 'N/A'}
                </Text>
                <Text style={styles.infoText}>
                  Original Language: {tvShow.original_language?.toUpperCase() || 'N/A'}
                </Text>
                <Text style={styles.infoText}>
                  First Air Date: {tvShow.first_air_date || 'N/A'}
                </Text>
                <Text style={styles.infoText}>
                  Last Air Date: {tvShow.last_air_date || 'N/A'}
                </Text>
                {tvShow.networks && tvShow.networks.length > 0 && (
                  <Text style={styles.infoText}>
                    Network: {tvShow.networks.map(n => n.name).join(', ')}
                  </Text>
                )}
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
  tvCard: {
    margin: 16,
    elevation: 4,
  },
  tvContent: {
    padding: 16,
  },
  tvHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  poster: {
    width: 120,
    height: 180,
    borderRadius: 8,
    marginRight: 16,
  },
  tvInfo: {
    flex: 1,
  },
  tvTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  tvYear: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  tvRating: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  tvSeasons: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  tvStatus: {
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

export default TVDetails;
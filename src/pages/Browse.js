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
  ScrollView,
} from "react-native";
import {
  Searchbar,
  Card,
  Text,
  Title,
  Surface,
  Button,
  Menu,
  Provider,
  IconButton,
  Chip,
} from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { MaterialIcons } from '@expo/vector-icons';

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const POSTER_BASE_URL = "https://image.tmdb.org/t/p/w500";
const API_KEY = Constants.expoConfig?.extra?.tmdbApiKey;

const { width } = Dimensions.get('window');
const itemWidth = (width - 60) / 2; // Two items per row with margins

// Genre options
const GENRES = [
  { id: '', name: 'All Genres' },
  { id: '28', name: 'Action' },
  { id: '12', name: 'Adventure' },
  { id: '16', name: 'Animation' },
  { id: '35', name: 'Comedy' },
  { id: '80', name: 'Crime' },
  { id: '99', name: 'Documentary' },
  { id: '18', name: 'Drama' },
  { id: '10751', name: 'Family' },
  { id: '14', name: 'Fantasy' },
  { id: '36', name: 'History' },
  { id: '27', name: 'Horror' },
  { id: '10402', name: 'Music' },
  { id: '9648', name: 'Mystery' },
  { id: '10749', name: 'Romance' },
  { id: '878', name: 'Science Fiction' },
  { id: '10770', name: 'TV Movie' },
  { id: '53', name: 'Thriller' },
  { id: '10752', name: 'War' },
  { id: '37', name: 'Western' }
];

// Sort options
const SORT_OPTIONS = [
  { value: 'popularity.desc', label: 'Most Popular' },
  { value: 'vote_average.desc', label: 'Highest Rated' },
  { value: 'release_date.desc', label: 'Newest' },
  { value: 'release_date.asc', label: 'Oldest' },
  { value: 'title.asc', label: 'A-Z' },
  { value: 'title.desc', label: 'Z-A' }
];

// Years array
const YEARS = [
  { value: '', label: 'All Years' },
  ...Array.from({ length: new Date().getFullYear() - 1949 }, (_, i) => {
    const year = new Date().getFullYear() - i;
    return { value: year.toString(), label: year.toString() };
  })
];

// Streaming providers (matching web app)
const STREAMING_PROVIDERS = [
  { id: '', name: 'All Services' },
  { id: '8', name: 'Netflix' },
  { id: '9', name: 'Amazon Prime Video' },
  { id: '15', name: 'Hulu' },
  { id: '337', name: 'Disney Plus' },
  { id: '384', name: 'HBO Max' },
  { id: '350', name: 'Apple TV Plus' },
  { id: '531', name: 'Paramount Plus' },
  { id: '386', name: 'Peacock' },
];

const Browse = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  
  // Filter states
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedSort, setSelectedSort] = useState('popularity.desc');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedProvider, setSelectedProvider] = useState(''); // Add streaming provider
  const [contentType, setContentType] = useState('movie'); // movie or tv
  const [viewMode, setViewMode] = useState('grid'); // grid or compact
  
  // Menu visibility states
  const [genreMenuVisible, setGenreMenuVisible] = useState(false);
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const [yearMenuVisible, setYearMenuVisible] = useState(false);
  const [providerMenuVisible, setProviderMenuVisible] = useState(false);

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

  const loadMovies = async (isSearch = false, query = '') => {
    setLoading(true);
    try {
      let url;
      if (isSearch && query.trim()) {
        url = `${TMDB_BASE_URL}/search/${contentType}?api_key=${API_KEY}&query=${encodeURIComponent(query)}`;
      } else {
        // Build discover URL with filters
        url = `${TMDB_BASE_URL}/discover/${contentType}?api_key=${API_KEY}&page=1`;
        
        if (selectedSort) {
          url += `&sort_by=${selectedSort}`;
        }
        
        if (selectedGenre) {
          url += `&with_genres=${selectedGenre}`;
        }
        
        if (selectedYear) {
          if (contentType === 'movie') {
            url += `&year=${selectedYear}`;
          } else {
            url += `&first_air_date_year=${selectedYear}`;
          }
        }
        
        if (selectedProvider) {
          url += `&with_watch_providers=${selectedProvider}`;
          url += `&watch_region=US`; // Default to US region
        }
        
        // Add minimum vote count for better quality results
        url += '&vote_count.gte=100';
      }
      
      const response = await fetch(url);
      const data = await response.json();
      setResults(data.results || []);
    } catch (error) {
      console.error("Error loading content:", error);
      Alert.alert("Error", "Failed to load content");
    }
    setLoading(false);
  };

  const loadPopularMovies = () => loadMovies(false);

  const handleSearch = (query) => {
    setSearchQuery(query);
    saveSearchQuery(query);
    if (query.trim()) {
      loadMovies(true, query);
    } else {
      loadMovies(false);
    }
  };

  // Effect to reload content when filters change
  useEffect(() => {
    if (!searchQuery.trim()) {
      loadMovies(false);
    }
  }, [selectedGenre, selectedSort, selectedYear, selectedProvider, contentType]);

  // Effect to reload content when content type changes
  useEffect(() => {
    loadMovies(false);
  }, [contentType]);

  const handleMoviePress = (item) => {
    if (contentType === 'movie') {
      navigation.navigate('MovieDetail', { movieId: item.id });
    } else {
      navigation.navigate('TVDetail', { tvId: item.id });
    }
  };

  const renderContentItem = ({ item }) => {
    const title = contentType === 'movie' ? item.title : item.name;
    const releaseDate = contentType === 'movie' ? item.release_date : item.first_air_date;
    
    if (viewMode === 'compact') {
      return (
        <TouchableOpacity
          style={styles.compactItem}
          onPress={() => handleMoviePress(item)}
        >
          <Image
            source={{ 
              uri: item.poster_path 
                ? `${POSTER_BASE_URL}${item.poster_path}` 
                : 'https://via.placeholder.com/300x450?text=No+Image'
            }}
            style={styles.compactPoster}
            resizeMode="cover"
          />
          <View style={styles.compactContent}>
            <Title numberOfLines={2} style={styles.compactTitle}>
              {title}
            </Title>
            <Text numberOfLines={1} style={styles.compactYear}>
              {releaseDate ? new Date(releaseDate).getFullYear() : 'N/A'}
            </Text>
            <Text numberOfLines={1} style={styles.compactRating}>
              ⭐ {item.vote_average?.toFixed(1) || 'N/A'}
            </Text>
          </View>
        </TouchableOpacity>
      );
    }

    return (
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
              {title}
            </Title>
            <Text numberOfLines={1} style={styles.movieDetails}>
              {releaseDate ? new Date(releaseDate).getFullYear() : 'N/A'} • {contentType}
            </Text>
            <Text numberOfLines={1} style={styles.movieRating}>
              ⭐ {item.vote_average?.toFixed(1) || 'N/A'} ({item.vote_count || 0} votes)
            </Text>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyText}>
        {searchQuery ? 'No movies found' : 'Start searching for movies!'}
      </Text>
    </View>
  );

  return (
    <Provider>
      <Surface style={styles.container}>
        {/* Header - matching web app */}
        <View style={styles.header}>
          <Title style={styles.headerTitle}>Browse</Title>
        </View>

        {/* Filter Controls - Grid Layout matching web app */}
        <View style={styles.filtersContainer}>
          {/* Filter Row 1 - matching web app */}
          <View style={styles.filterRow}>
            {/* Search */}
            <View style={styles.filterItem}>
              <Text style={styles.filterLabel}>Search</Text>
              <Searchbar
                placeholder="Search titles..."
                onChangeText={setSearchQuery}
                value={searchQuery}
                onSubmitEditing={() => handleSearch(searchQuery)}
                style={styles.searchInput}
                inputStyle={styles.searchInputText}
              />
            </View>

            {/* Genre Filter */}
            <View style={styles.filterItem}>
              <Text style={styles.filterLabel}>Genre</Text>
              <Menu
                visible={genreMenuVisible}
                onDismiss={() => setGenreMenuVisible(false)}
                anchor={
                  <Button 
                    mode="outlined" 
                    onPress={() => setGenreMenuVisible(true)}
                    style={styles.filterSelect}
                    contentStyle={styles.filterSelectContent}
                    labelStyle={styles.filterSelectLabel}
                  >
                    {GENRES.find(g => g.id === selectedGenre)?.name || 'All Genres'}
                  </Button>
                }
              >
                {GENRES.map((genre) => (
                  <Menu.Item
                    key={genre.id}
                    onPress={() => {
                      setSelectedGenre(genre.id);
                      setGenreMenuVisible(false);
                    }}
                    title={genre.name}
                  />
                ))}
              </Menu>
            </View>
          </View>

          {/* Filter Row 2 - matching web app */}
          <View style={styles.filterRow}>
            {/* Sort By Filter */}
            <View style={styles.filterItem}>
              <Text style={styles.filterLabel}>Sort By</Text>
              <Menu
                visible={sortMenuVisible}
                onDismiss={() => setSortMenuVisible(false)}
                anchor={
                  <Button 
                    mode="outlined" 
                    onPress={() => setSortMenuVisible(true)}
                    style={styles.filterSelect}
                    contentStyle={styles.filterSelectContent}
                    labelStyle={styles.filterSelectLabel}
                  >
                    {SORT_OPTIONS.find(s => s.value === selectedSort)?.label || 'Most Popular'}
                  </Button>
                }
              >
                {SORT_OPTIONS.map((option) => (
                  <Menu.Item
                    key={option.value}
                    onPress={() => {
                      setSelectedSort(option.value);
                      setSortMenuVisible(false);
                    }}
                    title={option.label}
                  />
                ))}
              </Menu>
            </View>

            {/* Year Filter */}
            <View style={styles.filterItem}>
              <Text style={styles.filterLabel}>Year</Text>
              <Menu
                visible={yearMenuVisible}
                onDismiss={() => setYearMenuVisible(false)}
                anchor={
                  <Button 
                    mode="outlined" 
                    onPress={() => setYearMenuVisible(true)}
                    style={styles.filterSelect}
                    contentStyle={styles.filterSelectContent}
                    labelStyle={styles.filterSelectLabel}
                  >
                    {selectedYear || 'All Years'}
                  </Button>
                }
              >
                <ScrollView style={{maxHeight: 300}}>
                  {YEARS.map((year) => (
                    <Menu.Item
                      key={year.value}
                      onPress={() => {
                        setSelectedYear(year.value);
                        setYearMenuVisible(false);
                      }}
                      title={year.label}
                    />
                  ))}
                </ScrollView>
              </Menu>
            </View>
          </View>

          {/* Filter Row 3 - matching web app */}
          <View style={styles.filterRow}>
            {/* Streaming Provider Filter */}
            <View style={styles.filterItem}>
              <Text style={styles.filterLabel}>Streaming</Text>
              <Menu
                visible={providerMenuVisible}
                onDismiss={() => setProviderMenuVisible(false)}
                anchor={
                  <Button 
                    mode="outlined" 
                    onPress={() => setProviderMenuVisible(true)}
                    style={styles.filterSelect}
                    contentStyle={styles.filterSelectContent}
                    labelStyle={styles.filterSelectLabel}
                  >
                    {STREAMING_PROVIDERS.find(p => p.id === selectedProvider)?.name || 'All Services'}
                  </Button>
                }
              >
                {STREAMING_PROVIDERS.map((provider) => (
                  <Menu.Item
                    key={provider.id}
                    onPress={() => {
                      setSelectedProvider(provider.id);
                      setProviderMenuVisible(false);
                    }}
                    title={provider.name}
                  />
                ))}
              </Menu>
            </View>

            {/* Content Type Filter */}
            <View style={styles.filterItem}>
              <Text style={styles.filterLabel}>Content Type</Text>
              <View style={styles.contentTypeContainer}>
                <Button 
                  mode={contentType === 'movie' ? 'contained' : 'outlined'}
                  onPress={() => setContentType('movie')}
                  style={[styles.contentTypeButton, contentType === 'movie' && styles.activeButton]}
                  buttonColor={contentType === 'movie' ? '#1890ff' : undefined}
                  compact
                >
                  Movies
                </Button>
                <Button 
                  mode={contentType === 'tv' ? 'contained' : 'outlined'}
                  onPress={() => setContentType('tv')}
                  style={[styles.contentTypeButton, contentType === 'tv' && styles.activeButton]}
                  buttonColor={contentType === 'tv' ? '#1890ff' : undefined}
                  compact
                >
                  TV Shows
                </Button>
              </View>
            </View>
          </View>

          {/* View Mode Row - matching web app */}
          <View style={styles.viewModeRow}>
            <Text style={styles.filterLabel}>View Mode</Text>
            <View style={styles.viewModeContainer}>
              <Button
                mode={viewMode === 'grid' ? 'contained' : 'outlined'}
                onPress={() => setViewMode('grid')}
                style={styles.viewModeButton}
                buttonColor={viewMode === 'grid' ? '#1890ff' : undefined}
                icon="grid"
                compact
              >
                Grid
              </Button>
              <Button
                mode={viewMode === 'compact' ? 'contained' : 'outlined'}
                onPress={() => setViewMode('compact')}
                style={styles.viewModeButton}
                buttonColor={viewMode === 'compact' ? '#1890ff' : undefined}
                icon="view-list"
                compact
              >
                Compact
              </Button>
            </View>
          </View>
        </View>

        {/* Active Filters - matching web app style */}
        {(selectedGenre || selectedYear || selectedProvider || selectedSort !== 'popularity.desc') && (
          <View style={styles.activeFiltersContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.activeFiltersScroll}>
              {selectedSort !== 'popularity.desc' && (
                <Chip 
                  onClose={() => setSelectedSort('popularity.desc')}
                  style={styles.filterChip}
                  textStyle={styles.filterChipText}
                >
                  Sort: {SORT_OPTIONS.find(s => s.value === selectedSort)?.label}
                </Chip>
              )}
              {selectedGenre && (
                <Chip 
                  onClose={() => setSelectedGenre('')}
                  style={styles.filterChip}
                  textStyle={styles.filterChipText}
                >
                  Genre: {GENRES.find(g => g.id === selectedGenre)?.name}
                </Chip>
              )}
              {selectedYear && (
                <Chip 
                  onClose={() => setSelectedYear('')}
                  style={styles.filterChip}
                  textStyle={styles.filterChipText}
                >
                  Year: {selectedYear}
                </Chip>
              )}
              {selectedProvider && (
                <Chip 
                  onClose={() => setSelectedProvider('')}
                  style={styles.filterChip}
                  textStyle={styles.filterChipText}
                >
                  Streaming: {STREAMING_PROVIDERS.find(p => p.id === selectedProvider)?.name}
                </Chip>
              )}
            </ScrollView>
          </View>
        )}

        {/* Content List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" />
            <Text style={styles.loadingText}>Loading {contentType === 'movie' ? 'movies' : 'TV shows'}...</Text>
          </View>
        ) : (
          <FlatList
            data={results}
            renderItem={renderContentItem}
            keyExtractor={(item) => item.id.toString()}
            numColumns={viewMode === 'grid' ? 2 : 1}
            key={viewMode} // Force re-render when view mode changes
            contentContainerStyle={styles.movieList}
            columnWrapperStyle={viewMode === 'grid' ? styles.row : null}
            ListEmptyComponent={renderEmptyState}
          />
        )}
      </Surface>
    </Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  filtersContainer: {
    backgroundColor: '#f4f4f9',
    padding: 24,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  filterItem: {
    flex: 1,
    marginRight: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  searchInput: {
    elevation: 0,
    backgroundColor: 'white',
    borderRadius: 6,
    height: 40,
  },
  searchInputText: {
    fontSize: 14,
  },
  filterSelect: {
    backgroundColor: 'white',
    borderColor: '#d9d9d9',
    borderRadius: 6,
    height: 40,
    justifyContent: 'center',
  },
  filterSelectContent: {
    height: 40,
  },
  filterSelectLabel: {
    fontSize: 14,
    marginLeft: 0,
  },
  contentTypeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  contentTypeButton: {
    flex: 1,
    borderRadius: 6,
  },
  activeButton: {
    backgroundColor: '#1890ff',
  },
  viewModeRow: {
    alignItems: 'flex-start',
  },
  viewModeContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  viewModeButton: {
    borderRadius: 6,
  },
  activeFiltersContainer: {
    backgroundColor: '#f4f4f9',
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  activeFiltersScroll: {
    flexGrow: 0,
  },
  filterChip: {
    marginRight: 8,
    backgroundColor: '#1890ff',
    borderRadius: 16,
  },
  filterChipText: {
    color: 'white',
    fontSize: 12,
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
    lineHeight: 18,
  },
  movieDetails: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  movieRating: {
    fontSize: 12,
    color: '#666',
  },
  // Compact view styles
  compactItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginBottom: 12,
    marginHorizontal: 16,
    borderRadius: 8,
    elevation: 2,
    padding: 12,
  },
  compactPoster: {
    width: 60,
    height: 90,
    borderRadius: 4,
    marginRight: 12,
  },
  compactContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  compactTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  compactYear: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  compactRating: {
    fontSize: 14,
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
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import {
  Searchbar,
  Card,
  Text,
  Title,
  Chip,
  Surface,
  Button,
} from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from '@react-native-async-storage/async-storage';

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const POSTER_BASE_URL = "https://image.tmdb.org/t/p/w500";

const Browse = () => {
  // Helper functions for AsyncStorage
  const saveSearchToStorage = async (search) => {
    try {
      await AsyncStorage.setItem("movieTracker_searchQuery", search);
    } catch (error) {
      console.warn("Could not save search to AsyncStorage:", error);
    }
  };

  const loadSearchFromStorage = async () => {
    try {
      const search = await AsyncStorage.getItem("movieTracker_searchQuery");
      return search || "";
    } catch (error) {
      console.warn("Could not load search from AsyncStorage:", error);
      return "";
    }
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [genres, setGenres] = useState([]);

  const navigation = useNavigation();

  const streamingProviders = [
    { id: 8, name: "Netflix", value: "8" },
    { id: 9, name: "Amazon Prime Video", value: "9" },
    { id: 15, name: "Hulu", value: "15" },
    { id: 337, name: "Disney Plus", value: "337" },
    { id: 384, name: "HBO Max", value: "384" },
    { id: 350, name: "Apple TV Plus", value: "350" },
    { id: 531, name: "Paramount Plus", value: "531" },
    { id: 386, name: "Peacock", value: "386" },
    { id: 387, name: "Crunchyroll", value: "387" },
    { id: 283, name: "Crackle", value: "283" },
    { id: 257, name: "Funimation", value: "257" },
    { id: 26, name: "Showtime", value: "26" },
    { id: 43, name: "Starz", value: "43" },
  ];

  const sortOptions = [
    { value: "popularity.desc", label: "Most Popular" },
    { value: "vote_average.desc", label: "Top Rated" },
    { value: "vote_count.desc", label: "Most Reviewed" },
    { value: "trending", label: "Trending Now" },
    { value: "revenue.desc", label: "Highest Grossing" },
    { value: "primary_release_date.desc", label: "Recently Released" },
    { value: "release_date.desc", label: "Newest First" },
    { value: "release_date.asc", label: "Oldest First" },
  ];

  const handleSelect = (value) => {
    const [type, id] = value.split("-");
    // Save current scroll position before navigating
    saveScrollPosition();
    if (type === "movie") {
      navigate(`/movie/${id}`);
    } else if (type === "tv") {
      navigate(`/tv/${id}`);
    }
  };

  const fetchGenres = async () => {
    try {
      const [movieResponse, tvResponse] = await Promise.all([
        fetch(
          `${TMDB_BASE_URL}/genre/movie/list?api_key=${process.env.REACT_APP_TMDB_API_KEY}&language=en-US`
        ),
        fetch(
          `${TMDB_BASE_URL}/genre/tv/list?api_key=${process.env.REACT_APP_TMDB_API_KEY}&language=en-US`
        ),
      ]);

      const movieData = await movieResponse.json();
      const tvData = await tvResponse.json();

      const allGenres = [...movieData.genres, ...tvData.genres];
      const uniqueGenres = Array.from(
        new Map(allGenres.map((item) => [item.id, item])).values()
      );
      setGenres(uniqueGenres);
    } catch (error) {
      console.error("Error fetching genres:", error);
    }
  };

  const buildApiUrl = (endpoint, contentType, page, params = {}) => {
    const baseParams = new URLSearchParams({
      api_key: process.env.REACT_APP_TMDB_API_KEY,
      page: page.toString(),
      ...params,
    });

    // Add genre filter for discover endpoints
    if (endpoint === "discover" && filters.genre !== "Any") {
      baseParams.append("with_genres", filters.genre);
    }

    // Add year filter for discover endpoints
    if (endpoint === "discover" && filters.year !== "Any") {
      if (contentType === "movie") {
        baseParams.append("year", filters.year);
      } else {
        baseParams.append("first_air_date_year", filters.year);
      }
    }

    // Add streaming provider filter for discover endpoints
    if (endpoint === "discover" && filters.provider !== "Any") {
      baseParams.append("with_watch_providers", filters.provider);
      baseParams.append("watch_region", "US"); // Default to US region
    }

    return `${TMDB_BASE_URL}/${endpoint}/${contentType}?${baseParams.toString()}`;
  };

  const applyPostFetchFilters = (results) => {
    let filtered = [...results];

    // Apply genre filter for endpoints that don't support it natively
    if (filters.genre !== "Any") {
      filtered = filtered.filter(
        (item) =>
          item.genre_ids && item.genre_ids.includes(parseInt(filters.genre))
      );
    }

    // Apply year filter for search results and trending
    if (filters.year !== "Any") {
      filtered = filtered.filter((item) => {
        const releaseDate = item.release_date || item.first_air_date;
        if (!releaseDate) return false;
        const year = new Date(releaseDate).getFullYear();
        return year === parseInt(filters.year);
      });
    }

    // Note: Streaming provider filtering for search/trending would require additional API calls
    // to get watch provider data for each item, which is not implemented here for performance reasons
    // The streaming provider filter works best with discover endpoints

    return filtered;
  };

  const fetchContent = async (page = 1, shouldAppend = false) => {
    setLoading(true);
    try {
      let apiUrls = [];
      let needsPostFiltering = false;

      if (searchQuery) {
        // Search endpoints - need post-filtering for genre/year
        if (filters.format === "Any" || filters.format === "movie") {
          apiUrls.push(
            buildApiUrl("search", "movie", page, {
              query: encodeURIComponent(searchQuery),
            })
          );
        }
        if (filters.format === "Any" || filters.format === "tv") {
          apiUrls.push(
            buildApiUrl("search", "tv", page, {
              query: encodeURIComponent(searchQuery),
            })
          );
        }
        needsPostFiltering = true;
      } else if (filters.sort === "trending") {
        // Trending endpoints - need post-filtering for genre/year
        if (filters.format === "Any" || filters.format === "movie") {
          apiUrls.push(buildApiUrl("trending", "movie/week", page));
        }
        if (filters.format === "Any" || filters.format === "tv") {
          apiUrls.push(buildApiUrl("trending", "tv/week", page));
        }
        needsPostFiltering = true;
      } else {
        // Discover endpoints - support all filters natively
        if (filters.format === "Any" || filters.format === "movie") {
          if (filters.sort === "vote_average.desc") {
            // For top-rated, get both highly rated AND popular movies, then combine them
            // First get top rated movies with reasonable vote count
            apiUrls.push(buildApiUrl("discover", "movie", page, { 
              sort_by: "vote_average.desc",
              "vote_count.gte": 500  // Higher threshold for more known movies
            }));
            // Also get popular movies to mix in well-known titles
            if (page === 1) { // Only on first page to avoid duplicates
              apiUrls.push(buildApiUrl("discover", "movie", 1, { 
                sort_by: "popularity.desc" 
              }));
            }
          } else {
            apiUrls.push(buildApiUrl("discover", "movie", page, { sort_by: filters.sort }));
          }
        }
        if (filters.format === "Any" || filters.format === "tv") {
          if (filters.sort === "vote_average.desc") {
            // Same logic for TV shows
            apiUrls.push(buildApiUrl("discover", "tv", page, { 
              sort_by: "vote_average.desc",
              "vote_count.gte": 500
            }));
            if (page === 1) {
              apiUrls.push(buildApiUrl("discover", "tv", 1, { 
                sort_by: "popularity.desc" 
              }));
            }
          } else {
            apiUrls.push(buildApiUrl("discover", "tv", page, { sort_by: filters.sort }));
          }
        }
      }

      // Fetch data from all URLs
      const responses = await Promise.all(apiUrls.map((url) => fetch(url)));
      const data = await Promise.all(
        responses.map((response) => response.json())
      );

      // Process and format results
      let formattedResults = data.flatMap((response) =>
        (response.results || []).map((item) => ({
          ...item,
          media_type: item.first_air_date ? "tv" : "movie",
          vote_average: Math.round(item.vote_average * 10) / 10,
        }))
      );

      // Apply post-fetch filtering if needed
      if (needsPostFiltering) {
        formattedResults = applyPostFetchFilters(formattedResults);
      }

      // Remove duplicates (can happen when format is 'Any')
      const uniqueResults = formattedResults.filter(
        (item, index, self) =>
          index ===
          self.findIndex(
            (t) => t.id === item.id && t.media_type === item.media_type
          )
      );

      // Sort results if needed
      if (filters.sort === "vote_average.desc") {
        // Sort purely by IMDB rating from highest to lowest
        uniqueResults.sort((a, b) => b.vote_average - a.vote_average);
      } else if (filters.sort === "release_date.desc") {
        uniqueResults.sort((a, b) => {
          const dateA = new Date(a.release_date || a.first_air_date);
          const dateB = new Date(b.release_date || b.first_air_date);
          return dateB - dateA;
        });
      } else if (filters.sort === "release_date.asc") {
        uniqueResults.sort((a, b) => {
          const dateA = new Date(a.release_date || a.first_air_date);
          const dateB = new Date(b.release_date || b.first_air_date);
          return dateA - dateB;
        });
      }

      // Calculate total pages
      const maxTotalPages = Math.max(
        ...data.map((response) => response.total_pages || 1)
      );
      setTotalPages(maxTotalPages);

      // Update results
      if (shouldAppend) {
        setResults((prevResults) => [...prevResults, ...uniqueResults]);
      } else {
        setResults(uniqueResults);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setResults([]);
    }
    setLoading(false);
  };

  const handleLoadMore = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    fetchContent(nextPage, true);
  };

  // Create debounced fetch function
  const debouncedFetch = useCallback(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
      fetchContent(1, false);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, filters]);

  useEffect(() => {
    fetchGenres();
  }, []);

  useEffect(() => {
    const cleanup = debouncedFetch();
    return cleanup;
  }, [debouncedFetch]);

  // Restore scroll position when results are loaded (indicating return from detail page)
  useEffect(() => {
    if (results.length > 0 && !loading) {
      restoreScrollPosition();
    }
  }, [results, loading]);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    saveFiltersToStorage(newFilters);
  };

  const handleRemoveFilter = (key) => {
    const newFilters = { ...filters, [key]: "Any" };
    setFilters(newFilters);
    saveFiltersToStorage(newFilters);
  };

  const handleRemoveSearch = () => {
    setSearchQuery("");
    saveSearchToStorage("");
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    saveViewModeToStorage(mode);
  };

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    saveSearchToStorage(value);
  };

  return (
    <Layout style={{ background: "#f4f4f9", minHeight: "100vh" }}>
      <Content style={{ padding: "24px", maxWidth: 1200, margin: "0 auto" }}>
        {/* Filters Row 1 */}
        <Row gutter={[16, 16]}>
          {/* Search */}
          <Col xs={24} sm={12} md={6} lg={6}>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              <Text strong>Search</Text>
              <Input
                placeholder="Search titles..."
                prefix={<SearchOutlined />}
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                style={{ width: "100%" }}
                allowClear
                loading={loading}
              />
            </div>
          </Col>

          {/* Genre */}
          <Col xs={24} sm={12} md={6} lg={6}>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              <Text strong>Genre</Text>
              <Select
                style={{ width: "100%" }}
                value={filters.genre}
                onChange={(value) => handleFilterChange("genre", value)}
                placeholder="Select genre"
              >
                <Select.Option value="Any">All Genres</Select.Option>
                {genres.map((genre) => (
                  <Select.Option key={genre.id} value={genre.id.toString()}>
                    {genre.name}
                  </Select.Option>
                ))}
              </Select>
            </div>
          </Col>

          {/* Sort By */}
          <Col xs={24} sm={12} md={6} lg={6}>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              <Text strong>Sort By</Text>
              <Select
                style={{ width: "100%" }}
                value={filters.sort}
                onChange={(value) => handleFilterChange("sort", value)}
                placeholder="Select sorting"
              >
                {sortOptions.map((option) => (
                  <Select.Option key={option.value} value={option.value}>
                    {option.label}
                  </Select.Option>
                ))}
              </Select>
            </div>
          </Col>

          {/* Year */}
          <Col xs={24} sm={12} md={6} lg={6}>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              <Text strong>Year</Text>
              <Select
                style={{ width: "100%" }}
                value={filters.year}
                onChange={(value) => handleFilterChange("year", value)}
                placeholder="Select year"
              >
                <Select.Option value="Any">All Years</Select.Option>
                {Array.from({ length: 30 }, (_, i) => {
                  const year = new Date().getFullYear() - i;
                  return (
                    <Select.Option key={year} value={year.toString()}>
                      {year}
                    </Select.Option>
                  );
                })}
              </Select>
            </div>
          </Col>
        </Row>

        {/* Filters Row 2 */}
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          {/* Streaming Provider */}
          <Col xs={24} sm={12} md={6} lg={6}>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              <Text strong>Streaming</Text>
              <Select
                style={{ width: "100%" }}
                value={filters.provider}
                onChange={(value) => handleFilterChange("provider", value)}
                placeholder="Select service"
              >
                <Select.Option value="Any">All Services</Select.Option>
                {streamingProviders.map((provider) => (
                  <Select.Option key={provider.id} value={provider.value}>
                    {provider.name}
                  </Select.Option>
                ))}
              </Select>
            </div>
          </Col>

          {/* Content Type */}
          <Col xs={24} sm={12} md={6} lg={6}>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              <Text strong>Content Type</Text>
              <Select
                style={{ width: "100%" }}
                value={filters.format}
                onChange={(value) => handleFilterChange("format", value)}
                placeholder="Select type"
              >
                <Select.Option value="Any">All Types</Select.Option>
                <Select.Option value="movie">Movies</Select.Option>
                <Select.Option value="tv">TV Shows</Select.Option>
              </Select>
            </div>
          </Col>

          {/* View Mode */}
          <Col xs={24} sm={12} md={6} lg={6}>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              <Text strong>View Mode</Text>
              <Space>
                <Button
                  type={viewMode === "grid" ? "primary" : "default"}
                  icon={<AppstoreOutlined />}
                  onClick={() => handleViewModeChange("grid")}
                >
                  Grid
                </Button>
                <Button
                  type={viewMode === "compact" ? "primary" : "default"}
                  icon={<TableOutlined />}
                  onClick={() => handleViewModeChange("compact")}
                >
                  Compact
                </Button>
              </Space>
            </div>
          </Col>
        </Row>

        {/* Active Filters */}
        <Row style={{ marginTop: 24, marginBottom: 24 }}>
          <Col span={24}>
            <Space size={[8, 16]} wrap>
              {searchQuery && (
                <Tag closable onClose={handleRemoveSearch}>
                  Search: {searchQuery}
                </Tag>
              )}
              {Object.entries(filters).map(
                ([key, value]) =>
                  value !== "Any" && (
                    <Tag
                      key={key}
                      closable
                      onClose={() => handleRemoveFilter(key)}
                    >
                      {key === "sort"
                        ? `Sort: ${
                            sortOptions.find((opt) => opt.value === value)
                              ?.label
                          }`
                        : key === "genre"
                        ? `Genre: ${
                            genres.find((g) => g.id.toString() === value)
                              ?.name || value
                          }`
                        : key === "format"
                        ? `Type: ${
                            value === "movie"
                              ? "Movies"
                              : value === "tv"
                              ? "TV Shows"
                              : value
                          }`
                        : key === "provider"
                        ? `Streaming: ${
                            streamingProviders.find((p) => p.value === value)
                              ?.name || value
                          }`
                        : `${
                            key.charAt(0).toUpperCase() + key.slice(1)
                          }: ${value}`}
                    </Tag>
                  )
              )}
            </Space>
          </Col>
        </Row>

        {/* Content Grid */}
        <Row gutter={[16, 16]}>
          {results.map((item) => (
            <Col
              key={`${item.id}-${item.media_type}`}
              xs={12}
              sm={8}
              md={viewMode === "grid" ? 6 : viewMode === "compact" ? 4 : 24}
            >
              <Card
                hoverable
                loading={loading}
                onClick={() => handleSelect(`${item.media_type}-${item.id}`)}
                cover={
                  <div
                    style={{
                      paddingTop: "150%",
                      position: "relative",
                      background: "#f0f0f0",
                      overflow: "hidden",
                    }}
                  >
                    <img
                      alt={item.title || item.name}
                      src={
                        item.poster_path
                          ? `${POSTER_BASE_URL}${item.poster_path}`
                          : "/api/placeholder/300/450"
                      }
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </div>
                }
                styles={{ body: { padding: "12px" } }}
              >
                <Card.Meta
                  title={
                    <Text style={{ fontSize: 14 }}>
                      {item.title || item.name}
                    </Text>
                  }
                  description={
                    <Space direction="vertical" size={0}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {new Date(
                          item.release_date || item.first_air_date
                        ).getFullYear()}{" "}
                        • {item.media_type}
                      </Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        ⭐ {item.vote_average} ({item.vote_count} votes)
                      </Text>
                    </Space>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>

        {/* Load More Button */}
        {results.length > 0 && currentPage < totalPages && (
          <Row justify="center" style={{ marginTop: 24 }}>
            <Col>
              <Button type="primary" loading={loading} onClick={handleLoadMore}>
                Load More
              </Button>
            </Col>
          </Row>
        )}
      </Content>
    </Layout>
  );
};

export default Browse;

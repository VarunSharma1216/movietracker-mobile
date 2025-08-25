import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {
  Text,
  Title,
  Card,
  Surface,
} from 'react-native-paper';

const Home = () => {
  return (
    <Surface style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Title style={styles.headerTitle}>Home</Title>
        
        <Card style={styles.card}>
          <Card.Content>
            <Title>Welcome to MovieTracker Mobile!</Title>
            <Text style={styles.description}>
              This is your home dashboard. In the full version, this would show:
            </Text>
            <Text style={styles.listItem}>• Recent activity from friends</Text>
            <Text style={styles.listItem}>• Recommended movies and TV shows</Text>
            <Text style={styles.listItem}>• Your watchlist progress</Text>
            <Text style={styles.listItem}>• Trending content</Text>
            <Text style={styles.listItem}>• Personal statistics</Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Title>Quick Stats</Title>
            <Text style={styles.statText}>Movies Watched: 0</Text>
            <Text style={styles.statText}>TV Shows Watched: 0</Text>
            <Text style={styles.statText}>Friends: 0</Text>
            <Text style={styles.statText}>Reviews Written: 0</Text>
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
  description: {
    fontSize: 14,
    marginBottom: 12,
    color: '#666',
  },
  listItem: {
    fontSize: 14,
    marginBottom: 4,
    color: '#333',
  },
  statText: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
});

export default Home;
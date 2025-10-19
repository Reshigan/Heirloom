import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Text,
  TouchableOpacity,
  Animated,
  PanResponder,
} from 'react-native';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';
import LinearGradient from 'react-native-linear-gradient';

interface Memory {
  id: string;
  title: string;
  type: 'milestone' | 'photo' | 'story' | 'achievement';
  x: number;
  y: number;
  connections: string[];
  timestamp: Date;
  importance: number;
  preview: string;
}

const { width, height } = Dimensions.get('window');

export const ConstellationScreen: React.FC = () => {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [scale] = useState(new Animated.Value(1));
  const [translateX] = useState(new Animated.Value(0));
  const [translateY] = useState(new Animated.Value(0));

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gestureState) => {
      translateX.setValue(gestureState.dx);
      translateY.setValue(gestureState.dy);
    },
    onPanResponderRelease: () => {
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    },
  });

  useEffect(() => {
    // Fetch memories from API
    fetchMemories();
  }, []);

  const fetchMemories = async () => {
    try {
      // This would connect to your backend API
      const response = await fetch('http://localhost:3001/api/memories/constellation');
      const data = await response.json();
      setMemories(data.memories.map((m: any) => ({
        ...m,
        timestamp: new Date(m.timestamp),
      })));
    } catch (error) {
      console.error('Failed to fetch memories:', error);
      // Fallback demo data
      setMemories([
        {
          id: '1',
          title: 'Wedding Day',
          type: 'milestone',
          x: width / 2,
          y: height / 2 - 100,
          connections: ['2', '3'],
          timestamp: new Date('2020-06-15'),
          importance: 5,
          preview: '💒',
        },
        {
          id: '2',
          title: 'First Child',
          type: 'milestone',
          x: width / 2 - 80,
          y: height / 2,
          connections: ['1'],
          timestamp: new Date('2021-03-22'),
          importance: 5,
          preview: '👶',
        },
        {
          id: '3',
          title: 'Family Vacation',
          type: 'photo',
          x: width / 2 + 80,
          y: height / 2,
          connections: ['1'],
          timestamp: new Date('2020-08-10'),
          importance: 4,
          preview: '🏖️',
        },
      ]);
    }
  };

  const getMemoryColor = (type: string, importance: number) => {
    const alpha = Math.min(importance / 5, 1);
    switch (type) {
      case 'milestone':
        return `rgba(255, 215, 0, ${alpha})`; // Gold
      case 'photo':
        return `rgba(135, 206, 235, ${alpha})`; // Sky blue
      case 'story':
        return `rgba(255, 182, 193, ${alpha})`; // Light pink
      case 'achievement':
        return `rgba(144, 238, 144, ${alpha})`; // Light green
      default:
        return `rgba(255, 255, 255, ${alpha})`;
    }
  };

  const handleMemoryPress = (memory: Memory) => {
    setSelectedMemory(memory);
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 1.2,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const renderConnections = () => {
    return memories.flatMap((memory) =>
      memory.connections.map((connectionId) => {
        const connectedMemory = memories.find((m) => m.id === connectionId);
        if (!connectedMemory) return null;

        return (
          <Line
            key={`${memory.id}-${connectionId}`}
            x1={memory.x}
            y1={memory.y}
            x2={connectedMemory.x}
            y2={connectedMemory.y}
            stroke="rgba(255, 255, 255, 0.3)"
            strokeWidth="1"
            strokeDasharray="5,5"
          />
        );
      })
    ).filter(Boolean);
  };

  const renderMemories = () => {
    return memories.map((memory) => (
      <TouchableOpacity
        key={memory.id}
        style={[
          styles.memoryNode,
          {
            left: memory.x - 25,
            top: memory.y - 25,
            backgroundColor: getMemoryColor(memory.type, memory.importance),
          },
        ]}
        onPress={() => handleMemoryPress(memory)}
      >
        <Text style={styles.memoryPreview}>{memory.preview}</Text>
      </TouchableOpacity>
    ));
  };

  return (
    <LinearGradient
      colors={['#0a0a0a', '#1a1a2e', '#16213e']}
      style={styles.container}
    >
      <Animated.View
        style={[
          styles.constellation,
          {
            transform: [
              { translateX },
              { translateY },
              { scale },
            ],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <Svg width={width} height={height} style={styles.svg}>
          {renderConnections()}
        </Svg>
        {renderMemories()}
      </Animated.View>

      {selectedMemory && (
        <View style={styles.memoryDetails}>
          <Text style={styles.memoryTitle}>{selectedMemory.title}</Text>
          <Text style={styles.memoryDate}>
            {selectedMemory.timestamp.toLocaleDateString()}
          </Text>
          <Text style={styles.memoryType}>
            {selectedMemory.type.charAt(0).toUpperCase() + selectedMemory.type.slice(1)}
          </Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setSelectedMemory(null)}
          >
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Legacy Constellation</Text>
        <Text style={styles.headerSubtitle}>
          {memories.length} memories preserved for future generations
        </Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  constellation: {
    flex: 1,
    position: 'relative',
  },
  svg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  memoryNode: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#fff',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  memoryPreview: {
    fontSize: 20,
  },
  header: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginTop: 5,
  },
  memoryDetails: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  memoryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  memoryDate: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 5,
  },
  memoryType: {
    fontSize: 12,
    color: '#ffd700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default ConstellationScreen;
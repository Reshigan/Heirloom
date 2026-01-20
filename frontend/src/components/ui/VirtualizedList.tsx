/**
 * VirtualizedList Component
 * Performance-optimized list rendering for large datasets
 * Uses intersection observer for efficient rendering
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';

interface VirtualizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight: number;
  overscan?: number;
  className?: string;
  emptyState?: React.ReactNode;
  loadingState?: React.ReactNode;
  isLoading?: boolean;
  onEndReached?: () => void;
  endReachedThreshold?: number;
}

export function VirtualizedList<T>({
  items,
  renderItem,
  itemHeight,
  overscan = 5,
  className = '',
  emptyState,
  loadingState,
  isLoading = false,
  onEndReached,
  endReachedThreshold = 200,
}: VirtualizedListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  // Calculate visible range
  const totalHeight = items.length * itemHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  // Handle scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    setScrollTop(target.scrollTop);

    // Check if near end for infinite scroll
    if (onEndReached) {
      const distanceFromEnd = target.scrollHeight - target.scrollTop - target.clientHeight;
      if (distanceFromEnd < endReachedThreshold) {
        onEndReached();
      }
    }
  }, [onEndReached, endReachedThreshold]);

  // Update container height on resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });

    resizeObserver.observe(container);
    setContainerHeight(container.clientHeight);

    return () => resizeObserver.disconnect();
  }, []);

  // Render visible items
  const visibleItems = [];
  for (let i = startIndex; i <= endIndex && i < items.length; i++) {
    visibleItems.push(
      <div
        key={i}
        style={{
          position: 'absolute',
          top: i * itemHeight,
          left: 0,
          right: 0,
          height: itemHeight,
        }}
      >
        {renderItem(items[i], i)}
      </div>
    );
  }

  // Show empty state
  if (!isLoading && items.length === 0 && emptyState) {
    return <div className={className}>{emptyState}</div>;
  }

  // Show loading state
  if (isLoading && items.length === 0 && loadingState) {
    return <div className={className}>{loadingState}</div>;
  }

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      onScroll={handleScroll}
      role="list"
      aria-busy={isLoading}
    >
      <div
        style={{
          position: 'relative',
          height: totalHeight,
          width: '100%',
        }}
      >
        {visibleItems}
      </div>
      {isLoading && items.length > 0 && (
        <div className="flex justify-center py-4">
          <div className="spinner" />
        </div>
      )}
    </div>
  );
}

/**
 * LazyImage Component
 * Image with lazy loading and placeholder
 */
interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholder?: string;
  aspectRatio?: string;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  placeholder,
  aspectRatio = '1/1',
  className = '',
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={`relative overflow-hidden bg-void-light ${className}`}
      style={{ aspectRatio }}
    >
      {/* Placeholder/skeleton */}
      {!isLoaded && (
        <div className="absolute inset-0 skeleton" />
      )}
      
      {/* Actual image */}
      <img
        ref={imgRef}
        src={isInView ? src : placeholder || ''}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        {...props}
      />
    </div>
  );
};

/**
 * InfiniteScroll Component
 * Simple infinite scroll wrapper using intersection observer
 */
interface InfiniteScrollProps {
  children: React.ReactNode;
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
  loader?: React.ReactNode;
  endMessage?: React.ReactNode;
  threshold?: number;
}

export const InfiniteScroll: React.FC<InfiniteScrollProps> = ({
  children,
  onLoadMore,
  hasMore,
  isLoading,
  loader,
  endMessage,
  threshold = 100,
}) => {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !isLoading) {
          onLoadMore();
        }
      },
      { rootMargin: `${threshold}px` }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoading, onLoadMore, threshold]);

  return (
    <div>
      {children}
      
      {/* Sentinel element for intersection observer */}
      <div ref={sentinelRef} className="h-1" />
      
      {/* Loading indicator */}
      {isLoading && (
        loader || (
          <div className="flex justify-center py-8">
            <div className="spinner" />
          </div>
        )
      )}
      
      {/* End message */}
      {!hasMore && !isLoading && endMessage && (
        <div className="text-center py-8 text-paper/50">
          {endMessage}
        </div>
      )}
    </div>
  );
};

export default VirtualizedList;

import React, { useState, useRef } from 'react';
import { RefreshCw } from 'lucide-react';

export default function PullToRefresh({ onRefresh, children }) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const maxPullDistance = 80;

  const handleTouchStart = (e) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e) => {
    if (isRefreshing || window.scrollY > 0) return;

    const currentY = e.touches[0].clientY;
    const distance = currentY - startY.current;

    if (distance > 0) {
      e.preventDefault();
      setPullDistance(Math.min(distance, maxPullDistance));
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance >= maxPullDistance && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    setPullDistance(0);
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {pullDistance > 0 && (
        <div
          className="flex items-center justify-center transition-all duration-200"
          style={{ height: pullDistance }}
        >
          <RefreshCw
            className={`w-6 h-6 text-green-600 transition-transform ${
              isRefreshing ? 'animate-spin' : ''
            }`}
            style={{
              transform: `rotate(${pullDistance * 3}deg)`
            }}
          />
        </div>
      )}
      {children}
    </div>
  );
}
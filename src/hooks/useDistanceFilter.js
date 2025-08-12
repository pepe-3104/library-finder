import { useState, useMemo } from 'react';

export const useDistanceFilter = (libraries = []) => {
  const [maxDistance, setMaxDistance] = useState(5); // デフォルトは5km

  const filteredLibraries = useMemo(() => {
    return libraries.filter(library => {
      // distanceが数値でない場合は0として扱う
      const distance = parseFloat(library.distance) || 0;
      return distance <= maxDistance;
    });
  }, [libraries, maxDistance]);

  const setDistanceFilter = (distance) => {
    setMaxDistance(distance);
  };

  return {
    filteredLibraries,
    maxDistance,
    setDistanceFilter,
    totalLibraries: libraries.length,
    filteredCount: filteredLibraries.length
  };
};
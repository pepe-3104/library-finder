import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useGeolocation } from '../useGeolocation';

describe('useGeolocation', () => {
  it('初期状態が正しく設定される', () => {
    const { result } = renderHook(() => useGeolocation());
    
    expect(result.current.location).toBe(null);
    expect(result.current.error).toBe(null);
    expect(result.current.loading).toBe(false);
  });

  it('位置情報取得が成功する', async () => {
    const mockPosition = {
      coords: {
        latitude: 35.6762,
        longitude: 139.6503,
        accuracy: 10
      }
    };

    // navigator.geolocation.getCurrentPositionをモック
    global.navigator.geolocation.getCurrentPosition = vi.fn((success) => {
      success(mockPosition);
    });

    const { result } = renderHook(() => useGeolocation());

    await act(async () => {
      result.current.getCurrentLocation();
    });

    expect(result.current.location).toEqual(mockPosition.coords);
    expect(result.current.error).toBe(null);
    expect(result.current.loading).toBe(false);
  });

  it('位置情報取得が失敗する', async () => {
    const mockError = new Error('位置情報の取得に失敗しました');

    global.navigator.geolocation.getCurrentPosition = vi.fn((success, error) => {
      error(mockError);
    });

    const { result } = renderHook(() => useGeolocation());

    await act(async () => {
      result.current.getCurrentLocation();
    });

    expect(result.current.location).toBe(null);
    expect(result.current.error).toBeDefined();
    expect(result.current.loading).toBe(false);
  });
});
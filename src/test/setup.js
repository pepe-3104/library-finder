import '@testing-library/jest-dom';

// モック環境変数
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_CALIL_API_KEY: 'test-calil-key',
    VITE_RAKUTEN_API_KEY: 'test-rakuten-key'
  }
});

// Geolocation API モック
global.navigator.geolocation = {
  getCurrentPosition: vi.fn((success) => {
    success({
      coords: {
        latitude: 35.6762,
        longitude: 139.6503,
        accuracy: 10
      }
    });
  }),
  watchPosition: vi.fn(),
  clearWatch: vi.fn()
};

// ResizeObserver モック (Leaflet用)
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// IntersectionObserver モック
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
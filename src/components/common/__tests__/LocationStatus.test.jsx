import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import LocationStatus from '../LocationStatus';

describe('LocationStatus', () => {
  const mockProps = {
    userLocation: {
      latitude: 35.6762,
      longitude: 139.6503,
      accuracy: 10
    },
    onRefresh: vi.fn(),
    distanceFilter: 5,
    onDistanceFilterChange: vi.fn(),
    libraryCount: 10
  };

  it('位置情報が表示される', () => {
    render(<LocationStatus {...mockProps} />);
    
    expect(screen.getByText(/現在位置/)).toBeInTheDocument();
    expect(screen.getByText(/35\.68/)).toBeInTheDocument();
    expect(screen.getByText(/139\.65/)).toBeInTheDocument();
  });

  it('位置情報がない場合、未取得状態が表示される', () => {
    render(<LocationStatus {...mockProps} userLocation={null} />);
    
    expect(screen.getByText(/位置情報未取得/)).toBeInTheDocument();
  });

  it('再取得ボタンがクリックできる', () => {
    render(<LocationStatus {...mockProps} />);
    
    const refreshButton = screen.getByRole('button');
    fireEvent.click(refreshButton);
    
    expect(mockProps.onRefresh).toHaveBeenCalledTimes(1);
  });

  it('距離フィルターが表示される', () => {
    render(<LocationStatus {...mockProps} />);
    
    expect(screen.getByText(/5km以内/)).toBeInTheDocument();
    expect(screen.getByText(/10件の図書館/)).toBeInTheDocument();
  });
});
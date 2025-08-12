import { useState, useCallback, useEffect } from 'react';

/**
 * 位置情報取得用のカスタムフック
 * Geolocation APIを使用してユーザーの現在位置を取得
 */
export const useGeolocation = () => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const getCurrentLocation = useCallback(() => {
    // Geolocation APIがサポートされているかチェック
    if (!navigator.geolocation) {
      setError('お使いのブラウザは位置情報の取得をサポートしていません');
      return;
    }

    setLoading(true);
    setError(null);

    // 位置情報取得のオプション
    const options = {
      enableHighAccuracy: true,  // 高精度モード
      timeout: 10000,           // 10秒でタイムアウト
      maximumAge: 300000        // 5分間キャッシュを利用
    };

    navigator.geolocation.getCurrentPosition(
      // 成功時のコールバック
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        
        setLocation({
          latitude,
          longitude,
          accuracy,
          timestamp: position.timestamp
        });
        setLoading(false);
        
        console.log('📍 位置情報取得成功:', {
          latitude: latitude.toFixed(6),
          longitude: longitude.toFixed(6),
          accuracy: `${Math.round(accuracy)}m`
        });
      },
      
      // エラー時のコールバック
      (err) => {
        let errorMessage = '位置情報の取得に失敗しました';
        
        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMessage = '位置情報の利用が許可されていません。ブラウザの設定を確認してください。';
            break;
          case err.POSITION_UNAVAILABLE:
            errorMessage = '位置情報を取得できませんでした。GPS信号を確認してください。';
            break;
          case err.TIMEOUT:
            errorMessage = '位置情報の取得がタイムアウトしました。しばらく待ってから再試行してください。';
            break;
          default:
            errorMessage = `位置情報取得エラー: ${err.message}`;
        }
        
        setError(errorMessage);
        setLoading(false);
        
        console.error('❌ 位置情報取得エラー:', err);
      },
      
      options
    );
  }, []);

  // 位置情報をクリア
  const clearLocation = useCallback(() => {
    setLocation(null);
    setError(null);
  }, []);

  // 自動的に位置情報を取得（コンポーネントマウント時）
  useEffect(() => {
    getCurrentLocation();
  }, [getCurrentLocation]);

  return {
    location,
    error,
    loading,
    getCurrentLocation,
    clearLocation
  };
};
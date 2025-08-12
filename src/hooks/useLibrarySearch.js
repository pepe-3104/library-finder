import { useState, useCallback } from "react";

export const useLibrarySearch = () => {
  const [libraries, setLibraries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const searchNearbyLibraries = useCallback(
    async (latitude, longitude, maxDistance = 10) => {
      setLoading(true);
      setError(null);
      setLibraries([]);

      try {
        // APIキーの確認
        const apiKey = import.meta.env.VITE_CALIL_API_KEY;
        if (!apiKey || apiKey === "your-api-key-here") {
          throw new Error(
            "カーリルAPIキーが設定されていません。.envファイルでVITE_CALIL_API_KEYを設定してください。"
          );
        }

        // カーリルAPIの図書館検索エンドポイント（位置情報ベース）
        // 距離ベース制限のため、大きめのlimitで取得してから距離でフィルタリング
        const apiUrl = `https://api.calil.jp/library?appkey=${apiKey}&geocode=${longitude},${latitude}&limit=100&format=json&callback=?`;

        // JSONPリクエストを作成
        const response = await makeJsonpRequest(apiUrl);

        if (response && response.length > 0) {
          const formattedLibraries = response
            .map((library) => ({
              id: library.systemid,
              systemid: library.systemid,
              name: library.formal || library.short,
              shortName: library.short,
              address: library.address,
              tel: library.tel,
              url: library.url_pc,
              distance: library.distance,
              category: library.category,
              geocode: library.geocode,
              isil: library.isil,
            }))
            // 距離ベースでフィルタリング
            .filter((library) => {
              // distance プロパティがある場合はそれを使用
              if (library.distance !== undefined && library.distance !== null) {
                return library.distance <= maxDistance;
              }
              
              // distance がない場合は geocode から計算
              if (library.geocode) {
                const [lng, lat] = library.geocode.split(',').map(Number);
                if (!isNaN(lat) && !isNaN(lng)) {
                  const calculatedDistance = calculateDistance(latitude, longitude, lat, lng);
                  library.distance = calculatedDistance; // 計算した距離を設定
                  return calculatedDistance <= maxDistance;
                }
              }
              
              return false; // 距離が計算できない場合は除外
            })
            // 距離でソート（近い順）
            .sort((a, b) => (a.distance || 0) - (b.distance || 0));

          setLibraries(formattedLibraries);
          console.log(
            `📚 ${maxDistance}km以内で${formattedLibraries.length}件の図書館が見つかりました:`,
            formattedLibraries
          );
        } else {
          setLibraries([]);
          console.log("🔍 該当する図書館が見つかりませんでした");
        }
      } catch (err) {
        console.error("図書館検索エラー:", err);
        setError(err.message || "図書館の検索中にエラーが発生しました。");
        setLibraries([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const clearResults = useCallback(() => {
    setLibraries([]);
    setError(null);
  }, []);

  return {
    libraries,
    loading,
    error,
    searchNearbyLibraries,
    clearResults,
  };
};

// Haversine公式による距離計算関数（km単位）
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // 地球の半径 (km)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return parseFloat(distance.toFixed(2)); // 小数点以下2桁で四捨五入
};

// JSONP リクエストを処理するユーティリティ関数
const makeJsonpRequest = (url) => {
  return new Promise((resolve, reject) => {
    // ランダムなコールバック名を生成
    const callbackName = `jsonp_callback_${Date.now()}_${Math.floor(
      Math.random() * 10000
    )}`;

    // グローバルコールバック関数を作成
    window[callbackName] = (data) => {
      // クリーンアップ
      document.head.removeChild(script);
      delete window[callbackName];
      resolve(data);
    };

    // URLにコールバック名を設定
    const finalUrl = url.replace("callback=?", `callback=${callbackName}`);

    // script タグを作成してJSONPリクエストを送信
    const script = document.createElement("script");
    script.src = finalUrl;
    script.onerror = () => {
      // エラーハンドリング
      document.head.removeChild(script);
      delete window[callbackName];
      reject(
        new Error(
          "図書館データの取得に失敗しました。ネットワーク接続を確認してください。"
        )
      );
    };

    // タイムアウト処理（15秒）
    const timeoutId = setTimeout(() => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
      if (window[callbackName]) {
        delete window[callbackName];
      }
      reject(
        new Error(
          "図書館検索がタイムアウトしました。時間をおいて再度お試しください。"
        )
      );
    }, 15000);

    // 成功時にタイムアウトをクリア
    const originalCallback = window[callbackName];
    window[callbackName] = (data) => {
      clearTimeout(timeoutId);
      originalCallback(data);
    };

    document.head.appendChild(script);
  });
};

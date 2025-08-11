import { useState, useCallback } from "react";

export const useLibrarySearch = () => {
  const [libraries, setLibraries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const searchNearbyLibraries = useCallback(
    async (latitude, longitude, limit = 20) => {
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
        const apiUrl = `https://api.calil.jp/library?appkey=${apiKey}&geocode=${longitude},${latitude}&limit=${limit}&format=json&callback=?`;

        // JSONPリクエストを作成
        const response = await makeJsonpRequest(apiUrl);

        if (response && response.length > 0) {
          const formattedLibraries = response.map((library) => ({
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
          }));

          setLibraries(formattedLibraries);
          console.log(
            `📚 ${formattedLibraries.length}件の図書館が見つかりました:`,
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

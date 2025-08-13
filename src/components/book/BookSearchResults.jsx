import React, { useState } from "react";
import {
  LibraryBooks,
  Business,
  CheckCircle,
  MenuBook,
  Home,
  CalendarToday,
  HelpOutline,
  ShoppingCart,
  Star,
  CurrencyYen,
  Link,
  CloudDownload,
  Error,
  Person,
  Domain,
  LocationOn,
  Phone,
  Whatshot,
  ExpandMore,
  ExpandLess,
} from "@mui/icons-material";
import { CircularProgress, Box, Typography } from "@mui/material";
import Pagination from "../common/Pagination";
import "./BookSearchResults.css";

// 最大表示距離（km）
const MAX_DISPLAY_DISTANCE = 10;

// ページネーション設定
const ITEMS_PER_PAGE = 10;

// 分館を距離順で並べて蔵書情報と統合する関数
const getBranchStatusList = (systems, libraries) => {
  if (!libraries || libraries.length === 0) return [];

  const branchStatusList = [];

  // 距離順でソートされた図書館リストを作成
  const sortedLibraries = [...libraries].sort((a, b) => (a.distance || 0) - (b.distance || 0));

  sortedLibraries.forEach(library => {
    const systemInfo = systems[library.systemid];
    
    if (systemInfo && systemInfo.libkey && Object.keys(systemInfo.libkey).length > 0) {
      // 各分館を個別に表示
      Object.entries(systemInfo.libkey).forEach(([libId, libInfo]) => {
        // libInfoがオブジェクトか文字列かを判定
        const isLibInfoObject = typeof libInfo === 'object' && libInfo !== null;
        const libName = isLibInfoObject ? (libInfo.name || libId) : libId;
        const libraryName = library.name || '';
        const libraryShortName = library.shortName || '';
        const status = isLibInfoObject ? libInfo.status : libInfo;
        
        // 図書館名でマッチングを試行（より緩い条件で、nullチェック追加）
        const nameMatches = (
          libName === libraryName || 
          libName === libraryShortName || 
          (libraryName && libName && libraryName.includes(libName)) || 
          (libName && libraryName && libName.includes(libraryName)) ||
          libId === libraryName ||
          libId === libraryShortName
        );
        
        // ステータスを分類
        const isNull = status === null || status === undefined;
        const isEmptyString = status === '';
        const noBookStatuses = ['No', 'なし', 'None', '蔵書なし', 'Not Found', 'EMPTY'];
        const isNoBook = noBookStatuses.includes(status);
        
        // エラー状態（null/undefined）は専用の状態で表示
        // 蔵書なし（明示的にない）は除外
        // それ以外（貸出可、貸出中など）は表示
        const shouldDisplay = nameMatches && !isNoBook && !isEmptyString;
        
        if (shouldDisplay) {
          const displayStatus = isNull ? 'error' : status;
          
          branchStatusList.push({
            ...library,
            systemName: systemInfo.systemName || library.systemid,
            branchName: libName,
            status: displayStatus,
            libId,
            libInfo,
            reserveUrl: systemInfo.reserveurl || (isLibInfoObject ? libInfo.reserveurl : undefined),
            hasError: isNull // エラー状態のフラグ
          });
        }
      });
    } else {
      // libkeyがない場合（検索中）は図書館として表示
      branchStatusList.push({
        ...library,
        systemName: systemInfo?.systemName || library.systemid,
        branchName: library.name,
        status: 'loading',
        libId: 'loading',
        libInfo: null
      });
    }
  });

  return branchStatusList;
};

// Haversine公式による距離計算関数（km単位）
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // 地球の半径 (km)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return parseFloat(distance.toFixed(2)); // 小数点以下2桁で四捨五入
};

const BookSearchResults = ({
  results,
  loading,
  searchQuery,
  searchType,
  onLoadLibraryData,
  userLocation,
  libraries,
  totalCount,
  pageInfo,
  onPageChange,
}) => {
  if (loading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        py={6}
        px={2}
      >
        <CircularProgress size={48} color="primary" sx={{ mb: 3 }} />
        <Box display="flex" alignItems="center" mb={1}>
          <LibraryBooks
            fontSize="small"
            sx={{ mr: 1, color: "primary.main" }}
          />
          <Typography variant="h6" color="text.primary">
            蔵書情報を検索中...
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          複数の図書館システムから情報を取得しています
        </Typography>
      </Box>
    );
  }

  if (!results || results.length === 0) {
    if (searchQuery) {
      return (
        <div className="search-results empty">
          <div className="empty-state">
            <p>
              <Error
                fontSize="small"
                style={{ marginRight: "6px", verticalAlign: "text-bottom" }}
              />
              検索結果が見つかりませんでした
            </p>
            <p className="empty-detail">
              {searchType === "isbn" ? "ISBN" : "タイトル"}: "{searchQuery}"
            </p>
            <div className="search-tips">
              <h4>
                <HelpOutline
                  fontSize="small"
                  style={{ marginRight: "6px", verticalAlign: "text-bottom" }}
                />
                検索のコツ
              </h4>
              <ul>
                <li>ISBNは正確な13桁または10桁の数字を入力してください</li>
                <li>タイトル検索では一部のキーワードでも検索できます</li>
                <li>全角・半角文字に注意してください</li>
              </ul>
            </div>
          </div>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="search-results">
      <div className="results-header">
        <h3>
          {searchType === 'popular' ? (
            <>
              <Whatshot
                fontSize="small"
                style={{ marginRight: "6px", verticalAlign: "text-bottom" }}
              />
              人気の本一覧
            </>
          ) : (
            <>
              <LibraryBooks
                fontSize="small"
                style={{ marginRight: "6px", verticalAlign: "text-bottom" }}
              />
              蔵書検索結果
            </>
          )}
        </h3>
        <p className="results-info">
          {searchType === 'popular' 
            ? `${searchQuery}: 総数${totalCount || 0}冊中 ${results.length}冊表示中`
            : `"${searchQuery}" の検索結果: 総数${totalCount || 0}冊中 ${results.length}冊表示中`
          }
          {pageInfo && searchType !== 'popular' && ` (ページ ${pageInfo.page}/${pageInfo.pageCount || Math.ceil((totalCount || 0) / ITEMS_PER_PAGE)})`}
        </p>
      </div>

      <div className="results-list">
        {results.map((book, index) => (
          <BookResultItem
            key={`${book.isbn}-${index}`}
            book={book}
            onLoadLibraryData={onLoadLibraryData}
            userLocation={userLocation}
            libraries={libraries}
            searchType={searchType}
            rankNumber={searchType === 'popular' ? ((pageInfo?.page || 1) - 1) * ITEMS_PER_PAGE + index + 1 : null}
          />
        ))}
      </div>

      {/* ページネーション（ISBN検索以外で複数ページがある場合のみ表示） */}
      {searchType !== 'isbn' && totalCount > ITEMS_PER_PAGE && pageInfo && onPageChange && (
        <Pagination
          currentPage={pageInfo.page}
          totalItems={totalCount}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={onPageChange}
          showFirstLast={true}
          showInfo={true}
        />
      )}
    </div>
  );
};

const BookResultItem = ({
  book,
  onLoadLibraryData,
  userLocation,
  libraries,
  searchType,
  rankNumber,
}) => {
  // 蔵書情報の展開状態を管理（検索完了後は自動展開）
  const [isLibraryInfoExpanded, setIsLibraryInfoExpanded] = useState(false);
  
  // 検索完了時に自動展開する
  React.useEffect(() => {
    if (book.isLibraryDataLoaded && Object.keys(book.systems || {}).length > 0) {
      setIsLibraryInfoExpanded(true);
    }
  }, [book.isLibraryDataLoaded, book.systems]);
  const getAvailabilityStatus = (status) => {
    switch (status) {
      case "貸出可":
        return {
          icon: <CheckCircle fontSize="small" />,
          text: "貸出可",
          class: "available",
        };
      case "貸出中":
        return {
          icon: <MenuBook fontSize="small" />,
          text: "貸出中",
          class: "unavailable",
        };
      case "館内のみ":
        return {
          icon: <Home fontSize="small" />,
          text: "館内のみ",
          class: "in-library",
        };
      case "予約可":
        return {
          icon: <CalendarToday fontSize="small" />,
          text: "予約可",
          class: "reservable",
        };
      default:
        return {
          icon: <HelpOutline fontSize="small" />,
          text: status || "不明",
          class: "unknown",
        };
    }
  };

  const getTotalLibrariesCount = (systems, libraries, userLocation) => {
    let count = 0;
    Object.entries(systems).forEach(([systemId, systemData]) => {
      if (!systemData.libkey) return;

      Object.entries(systemData.libkey).forEach(([branchName, status]) => {
        // ステータスを分類してカウント
        const isNull = status === null || status === undefined;
        const isEmptyString = status === '';
        const noBookStatuses = ['No', 'なし', 'None', '蔵書なし', 'Not Found', 'EMPTY'];
        const isNoBook = noBookStatuses.includes(status);
        
        // エラー状態は表示するが、蔵書なし・空文字は除外
        if (!isNoBook && !isEmptyString) {
          // 対応する個別図書館を検索
          const individualLibrary = libraries.find((lib) => {
            const systemMatch =
              lib.systemid === systemId || lib.id === systemId;
            const nameMatch =
              lib.name === branchName || lib.shortName === branchName;
            return (
              systemMatch &&
              (nameMatch ||
                branchName.includes(lib.shortName) ||
                lib.shortName.includes(branchName))
            );
          });

          let distance = null;
          if (individualLibrary && userLocation) {
            const [lng, lat] = individualLibrary.geocode.split(",").map(Number);
            if (!isNaN(lat) && !isNaN(lng)) {
              distance = calculateDistance(
                userLocation.latitude,
                userLocation.longitude,
                lat,
                lng
              );
            }
          }

          // 位置情報があり、指定距離内の場合のみカウント
          if (distance !== null && distance <= MAX_DISPLAY_DISTANCE) {
            count++;
          }
        }
      });
    });
    return count;
  };

  const getAvailableCount = (systems, libraries, userLocation) => {
    let count = 0;
    Object.entries(systems).forEach(([systemId, systemData]) => {
      if (!systemData.libkey) return;

      Object.entries(systemData.libkey).forEach(([branchName, status]) => {
        // 貸出可の場合のみ処理
        if (status === "貸出可") {
          // 対応する個別図書館を検索
          const individualLibrary = libraries.find((lib) => {
            const systemMatch =
              lib.systemid === systemId || lib.id === systemId;
            const nameMatch =
              lib.name === branchName || lib.shortName === branchName;
            return (
              systemMatch &&
              (nameMatch ||
                branchName.includes(lib.shortName) ||
                lib.shortName.includes(branchName))
            );
          });

          let distance = null;
          if (individualLibrary && userLocation) {
            const [lng, lat] = individualLibrary.geocode.split(",").map(Number);
            if (!isNaN(lat) && !isNaN(lng)) {
              distance = calculateDistance(
                userLocation.latitude,
                userLocation.longitude,
                lat,
                lng
              );
            }
          }

          // 位置情報があり、指定距離内の場合のみカウント
          if (distance !== null && distance <= MAX_DISPLAY_DISTANCE) {
            count++;
          }
        }
      });
    });
    return count;
  };

  return (
    <div className={`book-result-item ${book.isFutureRelease ? 'future-release' : ''}`}>
      {/* ランキングバッジ（人気の本の場合のみ表示） */}
      {searchType === 'popular' && rankNumber && (
        <div className="rank-badge">
          #{rankNumber}
        </div>
      )}
      <div className="book-header">
        {/* 書籍画像 */}
        {book.imageUrl && (
          <div className="book-image">
            <img
              src={book.imageUrl}
              alt={book.title}
              onError={(e) => (e.target.style.display = "none")}
            />
          </div>
        )}

        <div className="book-info">
          <h4 className="book-title">{book.title || "タイトル不明"}</h4>
          <p className="book-isbn">
            <MenuBook
              fontSize="small"
              style={{ marginRight: "6px", verticalAlign: "text-bottom" }}
            />
            ISBN: {book.isbn}
          </p>

          {/* 書籍の詳細情報 */}
          {book.author && (
            <p className="book-author">
              <Person
                fontSize="small"
                style={{ marginRight: "6px", verticalAlign: "text-bottom" }}
              />
              著者: {book.author}
            </p>
          )}
          {book.publisher && (
            <p className="book-publisher">
              <Domain
                fontSize="small"
                style={{ marginRight: "6px", verticalAlign: "text-bottom" }}
              />
              出版社: {book.publisher}
            </p>
          )}
          {(book.pubdate || book.publishDate) && (
            <p className="book-pubdate">
              <CalendarToday
                fontSize="small"
                style={{ marginRight: "6px", verticalAlign: "text-bottom" }}
              />
              出版日: {book.pubdate || book.publishDate}
            </p>
          )}

          {/* 楽天Books情報 */}
          {book.price && (
            <p className="book-price">
              <CurrencyYen
                fontSize="small"
                style={{ marginRight: "6px", verticalAlign: "text-bottom" }}
              />
              価格: ¥{book.price.toLocaleString()}
            </p>
          )}
          {book.reviewAverage && (
            <p className="book-review">
              <Star
                fontSize="small"
                style={{ marginRight: "6px", verticalAlign: "text-bottom" }}
              />
              評価: {book.reviewAverage} ({book.reviewCount}件)
            </p>
          )}
          <div className="availability-summary">
            {book.isLibraryDataLoaded ? (
              <>
                <span className="total-libraries">
                  <Business fontSize="small" style={{ marginRight: "4px" }} />
                  {getTotalLibrariesCount(
                    book.systems,
                    libraries,
                    userLocation
                  )}
                  館中
                </span>
                <span className="available-libraries">
                  <CheckCircle
                    fontSize="small"
                    style={{ marginRight: "4px" }}
                  />
                  {getAvailableCount(book.systems, libraries, userLocation)}
                  館で貸出可
                </span>
              </>
            ) : (
              <>
                {/* 蔵書情報の段階的表示 */}
                {Object.keys(book.systems || {}).length === 0 && !book.isLibraryDataLoading && (
                  <>
                    <span className="library-data-pending">
                      <LibraryBooks
                        fontSize="small"
                        style={{ marginRight: "4px" }}
                      />
                      蔵書情報は「もっと読み込む」で確認できます
                    </span>
                    {!book.isFutureRelease && (
                      <button
                        className="load-library-data-button"
                        onClick={() => onLoadLibraryData(book.isbn)}
                        disabled={book.isLibraryDataLoading}
                      >
                        <CloudDownload
                          fontSize="small"
                          style={{ marginRight: "4px" }}
                        />
                        蔵書情報を読み込む
                      </button>
                    )}
                  </>
                )}
                
                {/* 取得済み蔵書情報の表示 */}
                {Object.keys(book.systems || {}).length > 0 && (
                  <div className="library-systems" style={{ 
                    width: "100%",
                    marginTop: "8px",
                    marginLeft: book.imageUrl ? '-132px' : '0px', // 画像分だけ左に伸ばす（画像幅 + マージン）
                    paddingLeft: book.imageUrl ? '132px' : '0px' // 画像部分のパディング
                  }}>
                    <div 
                      onClick={() => setIsLibraryInfoExpanded(!isLibraryInfoExpanded)}
                      style={{ 
                        margin: "0 0 8px 0", 
                        fontSize: "0.9rem", 
                        display: "flex", 
                        alignItems: "center",
                        fontWeight: "600",
                        color: "#333",
                        cursor: "pointer",
                        padding: "8px 12px",
                        backgroundColor: "#f8f9fa",
                        borderRadius: "6px",
                        border: "1px solid #dee2e6",
                        transition: "all 0.2s ease",
                        justifyContent: "space-between",
                        width: "100%" // 幅を明示的に100%に
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <LibraryBooks fontSize="small" style={{ marginRight: "6px" }} />
                        蔵書情報
                        {getBranchStatusList(book.systems || {}, libraries).length > 0 && (
                          <span style={{
                            marginLeft: "8px",
                            fontSize: "0.8rem",
                            color: "#666",
                            fontWeight: "normal"
                          }}>
                            ({getBranchStatusList(book.systems || {}, libraries).length}館)
                          </span>
                        )}
                        {book.isLibraryDataLoading && book.librarySearchProgress && (
                          <span style={{ 
                            fontSize: "0.75rem", 
                            color: "#666", 
                            marginLeft: "8px",
                            fontWeight: "normal"
                          }}>
                            ({book.librarySearchProgress.completed}/{book.librarySearchProgress.total}館検索済み)
                          </span>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "center" }}>
                        {book.isLibraryDataLoading && (
                          <CircularProgress size={16} style={{ marginRight: "8px" }} />
                        )}
                        {isLibraryInfoExpanded ? (
                          <ExpandLess fontSize="small" />
                        ) : (
                          <ExpandMore fontSize="small" />
                        )}
                      </div>
                    </div>
                    {isLibraryInfoExpanded && getBranchStatusList(book.systems || {}, libraries).map((branch, index) => {
                      const statusInfo = getAvailabilityStatus(branch.status);
                      return (
                        <div key={`${branch.systemid}-${branch.libId}-${index}`} className="library-item" style={{
                          padding: "12px",
                          marginBottom: "8px", 
                          backgroundColor: "white",
                          border: "1px solid #dee2e6",
                          borderRadius: "8px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                          width: "100%",
                          marginLeft: "0",
                          marginRight: "0"
                        }}>
                          <div className="library-info" style={{ flex: 1 }}>
                            <div className="library-name" style={{ 
                              fontWeight: "bold", 
                              fontSize: "0.95rem", 
                              marginBottom: "4px",
                              display: "flex",
                              alignItems: "center"
                            }}>
                              <Business fontSize="small" style={{ marginRight: "6px", color: "#495057" }} />
                              {branch.branchName}
                            </div>
                            {branch.systemName && (
                              <div style={{ fontSize: "0.8rem", color: "#6c757d", marginBottom: "2px" }}>
                                <Domain fontSize="small" style={{ marginRight: "4px", fontSize: "0.7rem", verticalAlign: "text-bottom" }} />
                                {branch.systemName}
                              </div>
                            )}
                            <div className="library-details" style={{ fontSize: "0.8rem", color: "#666" }}>
                              <LocationOn fontSize="small" style={{ marginRight: "4px", fontSize: "0.7rem", verticalAlign: "text-bottom" }} />
                              {branch.distance}km • {branch.address}
                            </div>
                            {branch.reserveUrl && (
                              <div style={{ marginTop: "4px" }}>
                                <a 
                                  href={branch.reserveUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    fontSize: "0.75rem",
                                    color: "#007bff",
                                    textDecoration: "none",
                                    display: "flex",
                                    alignItems: "center"
                                  }}
                                >
                                  <Link fontSize="small" style={{ marginRight: "2px", fontSize: "0.7rem" }} />
                                  予約・詳細
                                </a>
                              </div>
                            )}
                          </div>
                          
                          <div className="library-status" style={{ marginLeft: "12px" }}>
                            {branch.status === 'loading' ? (
                              <div style={{ 
                                display: "flex", 
                                alignItems: "center",
                                backgroundColor: "#e9ecef",
                                color: "#6c757d",
                                padding: "6px 12px",
                                borderRadius: "16px",
                                fontSize: "0.8rem"
                              }}>
                                <CircularProgress size={14} style={{ marginRight: "6px" }} />
                                確認中
                              </div>
                            ) : branch.status === 'error' || branch.hasError ? (
                              <div style={{ 
                                display: "flex", 
                                alignItems: "center",
                                backgroundColor: "#f8d7da",
                                color: "#721c24",
                                padding: "6px 12px",
                                borderRadius: "16px",
                                fontSize: "0.8rem",
                                fontWeight: "bold"
                              }}>
                                <Error fontSize="small" style={{ marginRight: "4px" }} />
                                検索エラー
                              </div>
                            ) : (
                              <div style={{ 
                                display: "flex", 
                                alignItems: "center",
                                backgroundColor: statusInfo.class === 'available' ? "#d4edda" :
                                                statusInfo.class === 'unavailable' ? "#f8d7da" :
                                                statusInfo.class === 'reservable' ? "#fff3cd" : "#e9ecef",
                                color: statusInfo.class === 'available' ? "#155724" :
                                       statusInfo.class === 'unavailable' ? "#721c24" :
                                       statusInfo.class === 'reservable' ? "#856404" : "#6c757d",
                                padding: "6px 12px",
                                borderRadius: "16px",
                                fontSize: "0.8rem",
                                fontWeight: "bold"
                              }}>
                                {statusInfo.icon}
                                <span style={{ marginLeft: "4px" }}>{statusInfo.text}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    
                    {isLibraryInfoExpanded && book.isLibraryDataLoading && (
                      <Box 
                        display="flex" 
                        alignItems="center" 
                        mt={1}
                        sx={{ 
                          fontSize: "0.8rem", 
                          color: "#666",
                          padding: "12px",
                          backgroundColor: "#f8f9fa",
                          borderRadius: "8px",
                          border: "1px solid #dee2e6",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                          width: "100%",
                          marginLeft: 0,
                          marginRight: 0
                        }}
                      >
                        <CircularProgress size={16} sx={{ mr: 1.5 }} />
                        <Box sx={{ display: "flex", flexDirection: "column", flex: 1 }}>
                          <span style={{ fontWeight: "500" }}>他の図書館も検索中...</span>
                          {book.librarySearchProgress && (
                            <span style={{ 
                              marginTop: "2px", 
                              fontSize: "0.75rem",
                              color: "#888",
                              fontWeight: "bold" 
                            }}>
                              進捗: {book.librarySearchProgress.completed}/{book.librarySearchProgress.total}館検索済み
                            </span>
                          )}
                        </Box>
                      </Box>
                    )}
                  </div>
                )}

                {book.isFutureRelease && Object.keys(book.systems || {}).length === 0 && (
                  <div className="future-release-notice">
                    <CalendarToday 
                      fontSize="small" 
                      style={{ marginRight: "4px", color: "#999" }} 
                    />
                    <span style={{ color: "#999", fontSize: "0.9em" }}>
                      発売前のため蔵書検索はできません
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* 蔵書情報セクション - 画像の下から右端まで横幅いっぱい（蔵書がある場合のみ） */}
      {book.isLibraryDataLoaded && Object.keys(book.systems).length > 0 && getTotalLibrariesCount(book.systems, libraries, userLocation) > 0 && (
        <div className="library-systems" style={{
          width: "100%",
          marginTop: "16px",
          padding: "16px",
          backgroundColor: "#f8f9fa",
          borderRadius: "8px",
          border: "1px solid #dee2e6"
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "16px",
            fontWeight: "600",
            fontSize: "1rem",
            color: "#333"
          }}>
            <LibraryBooks fontSize="small" style={{ marginRight: "8px" }} />
            蔵書情報詳細
          </div>
          {(() => {
            // 個々の図書館レベルで蔵書情報を展開し、距離順にソート
            const individualLibrariesWithBooks = [];

            Object.entries(book.systems).forEach(([systemId, systemData]) => {
              if (!systemData.libkey) return;

              // 各図書館支店の蔵書情報を個別に処理
              Object.entries(systemData.libkey).forEach(
                ([branchName, status]) => {
                  // 蔵書がある場合のみ処理
                  if (
                    status === "貸出可" ||
                    status === "館内のみ" ||
                    status === "予約可" ||
                    status === "貸出中"
                  ) {
                    // 対応する個別図書館を検索
                    const individualLibrary = libraries.find((lib) => {
                      // systemidの一致をチェック
                      const systemMatch =
                        lib.systemid === systemId || lib.id === systemId;
                      // 図書館名の一致もチェック（より正確なマッチング）
                      const nameMatch =
                        lib.name === branchName || lib.shortName === branchName;
                      return (
                        systemMatch &&
                        (nameMatch ||
                          branchName.includes(lib.shortName) ||
                          lib.shortName.includes(branchName))
                      );
                    });

                    let distance = null;
                    if (individualLibrary && userLocation) {
                      const [lng, lat] = individualLibrary.geocode
                        .split(",")
                        .map(Number);
                      if (!isNaN(lat) && !isNaN(lng)) {
                        distance = calculateDistance(
                          userLocation.latitude,
                          userLocation.longitude,
                          lat,
                          lng
                        );
                      }
                    }

                    // 距離が計算できない場合（位置情報がない場合）は除外
                    if (distance === null) {
                      return; // 位置情報がない図書館は除外
                    }

                    // 最大表示距離を超える場合は除外
                    if (distance > MAX_DISPLAY_DISTANCE) {
                      return; // 距離外の図書館は除外
                    }

                    individualLibrariesWithBooks.push({
                      systemId,
                      systemData,
                      branchName,
                      status,
                      library: individualLibrary,
                      distance,
                      systemName: systemData.systemName || systemId,
                    });
                  }
                }
              );
            });

            // 距離順にソート（すべて距離が設定されているため、シンプルなソート）
            individualLibrariesWithBooks.sort(
              (a, b) => a.distance - b.distance
            );

            return individualLibrariesWithBooks.map(
              (
                {
                  systemId,
                  systemData,
                  branchName,
                  status,
                  library,
                  distance,
                  systemName,
                },
                index
              ) => {
                const statusInfo = getAvailabilityStatus(status);
                const uniqueKey = `${systemId}-${branchName}-${index}`;

                return (
                  <div key={uniqueKey} className="individual-library" style={{
                    padding: "16px",
                    marginBottom: "12px",
                    backgroundColor: "white",
                    borderRadius: "8px",
                    border: "1px solid #dee2e6",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                  }}>
                    <div className="library-header" style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "8px"
                    }}>
                      <div className="library-info" style={{ flex: 1 }}>
                        <h5 className="library-name" style={{
                          margin: "0 0 4px 0",
                          fontSize: "1rem",
                          fontWeight: "600",
                          color: "#333",
                          display: "flex",
                          alignItems: "center"
                        }}>
                          <Business fontSize="small" style={{ marginRight: "6px", color: "#666" }} />
                          {branchName}
                        </h5>
                        <span className="library-system" style={{
                          fontSize: "0.8rem",
                          color: "#666",
                          display: "flex",
                          alignItems: "center"
                        }}>
                          <Domain fontSize="small" style={{ marginRight: "4px", fontSize: "0.7rem" }} />
                          {systemName}
                        </span>
                      </div>
                      <div className="library-status-distance" style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                        gap: "4px"
                      }}>
                        <span className={`library-status ${statusInfo.class}`} style={{
                          display: "flex",
                          alignItems: "center",
                          backgroundColor: statusInfo.class === 'available' ? "#d4edda" :
                                          statusInfo.class === 'unavailable' ? "#f8d7da" :
                                          statusInfo.class === 'reservable' ? "#fff3cd" : "#e9ecef",
                          color: statusInfo.class === 'available' ? "#155724" :
                                 statusInfo.class === 'unavailable' ? "#721c24" :
                                 statusInfo.class === 'reservable' ? "#856404" : "#6c757d",
                          padding: "4px 8px",
                          borderRadius: "12px",
                          fontSize: "0.8rem",
                          fontWeight: "bold"
                        }}>
                          {statusInfo.icon}
                          <span style={{ marginLeft: "4px" }}>{statusInfo.text}</span>
                        </span>
                        <span className="library-distance" style={{
                          fontSize: "0.75rem",
                          color: "#666",
                          display: "flex",
                          alignItems: "center"
                        }}>
                          <LocationOn
                            fontSize="small"
                            style={{ marginRight: "2px", fontSize: "0.7rem" }}
                          />
                          {distance}km
                        </span>
                      </div>
                    </div>

                    {library && (
                      <div className="library-details" style={{
                        marginTop: "8px",
                        paddingTop: "8px",
                        borderTop: "1px solid #e9ecef"
                      }}>
                        {library.address && (
                          <p className="library-address" style={{
                            margin: "0 0 4px 0",
                            fontSize: "0.85rem",
                            color: "#666",
                            display: "flex",
                            alignItems: "center"
                          }}>
                            <LocationOn
                              fontSize="small"
                              style={{
                                marginRight: "6px",
                                fontSize: "0.8rem",
                                color: "#888"
                              }}
                            />
                            {library.address}
                          </p>
                        )}
                        {library.tel && (
                          <p className="library-tel" style={{
                            margin: "0",
                            fontSize: "0.85rem",
                            color: "#666",
                            display: "flex",
                            alignItems: "center"
                          }}>
                            <Phone
                              fontSize="small"
                              style={{
                                marginRight: "6px",
                                fontSize: "0.8rem",
                                color: "#888"
                              }}
                            />
                            {library.tel}
                          </p>
                        )}
                      </div>
                    )}

                    {systemData.reserveurl && (
                      <div className="library-actions" style={{
                        marginTop: "12px",
                        paddingTop: "8px",
                        borderTop: "1px solid #e9ecef"
                      }}>
                        <a
                          href={systemData.reserveurl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="reserve-link"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            fontSize: "0.85rem",
                            color: "#007bff",
                            textDecoration: "none",
                            padding: "6px 12px",
                            backgroundColor: "#e3f2fd",
                            borderRadius: "6px",
                            border: "1px solid #bbdefb",
                            transition: "all 0.2s ease"
                          }}
                          onMouseOver={(e) => {
                            e.target.style.backgroundColor = "#bbdefb";
                          }}
                          onMouseOut={(e) => {
                            e.target.style.backgroundColor = "#e3f2fd";
                          }}
                        >
                          <Link
                            fontSize="small"
                            style={{ marginRight: "6px", fontSize: "0.8rem" }}
                          />
                          予約・詳細を見る
                        </a>
                      </div>
                    )}
                  </div>
                );
              }
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default BookSearchResults;

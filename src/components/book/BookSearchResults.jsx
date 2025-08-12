import React from 'react';
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
  AttachMoney,
  Link,
  CloudDownload,
  Error,
  Person,
  Domain,
  LocationOn,
  Phone
} from '@mui/icons-material';
import { CircularProgress, Box, Typography } from '@mui/material';
import './BookSearchResults.css';

// 最大表示距離（km）
const MAX_DISPLAY_DISTANCE = 10;

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

const BookSearchResults = ({ results, loading, searchQuery, searchType, onLoadLibraryData, userLocation, libraries }) => {
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
          <LibraryBooks fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
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
              <Error fontSize="small" style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} />
              検索結果が見つかりませんでした
            </p>
            <p className="empty-detail">
              {searchType === 'isbn' ? 'ISBN' : 'タイトル'}: "{searchQuery}"
            </p>
            <div className="search-tips">
              <h4>
                <HelpOutline fontSize="small" style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} />
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
          <LibraryBooks fontSize="small" style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} />
          蔵書検索結果
        </h3>
        <p className="results-info">
          "{searchQuery}" の検索結果: {results.length}冊
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
          />
        ))}
      </div>

    </div>
  );
};

const BookResultItem = ({ book, onLoadLibraryData, userLocation, libraries }) => {
  const getAvailabilityStatus = (status) => {
    switch (status) {
      case '貸出可':
        return { 
          icon: <CheckCircle fontSize="small" />, 
          text: '貸出可', 
          class: 'available' 
        };
      case '貸出中':
        return { 
          icon: <MenuBook fontSize="small" />, 
          text: '貸出中', 
          class: 'unavailable' 
        };
      case '館内のみ':
        return { 
          icon: <Home fontSize="small" />, 
          text: '館内のみ', 
          class: 'in-library' 
        };
      case '予約可':
        return { 
          icon: <CalendarToday fontSize="small" />, 
          text: '予約可', 
          class: 'reservable' 
        };
      default:
        return { 
          icon: <HelpOutline fontSize="small" />, 
          text: status || '不明', 
          class: 'unknown' 
        };
    }
  };

  const getTotalLibrariesCount = (systems, libraries, userLocation) => {
    let count = 0;
    Object.entries(systems).forEach(([systemId, systemData]) => {
      if (!systemData.libkey) return;
      
      Object.entries(systemData.libkey).forEach(([branchName, status]) => {
        // 蔵書がある場合のみカウント
        if (status === '貸出可' || status === '館内のみ' || status === '予約可' || status === '貸出中') {
          // 対応する個別図書館を検索
          const individualLibrary = libraries.find(lib => {
            const systemMatch = lib.systemid === systemId || lib.id === systemId;
            const nameMatch = lib.name === branchName || lib.shortName === branchName;
            return systemMatch && (nameMatch || branchName.includes(lib.shortName) || lib.shortName.includes(branchName));
          });

          let distance = null;
          if (individualLibrary && userLocation) {
            const [lng, lat] = individualLibrary.geocode.split(',').map(Number);
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
        if (status === '貸出可') {
          // 対応する個別図書館を検索
          const individualLibrary = libraries.find(lib => {
            const systemMatch = lib.systemid === systemId || lib.id === systemId;
            const nameMatch = lib.name === branchName || lib.shortName === branchName;
            return systemMatch && (nameMatch || branchName.includes(lib.shortName) || lib.shortName.includes(branchName));
          });

          let distance = null;
          if (individualLibrary && userLocation) {
            const [lng, lat] = individualLibrary.geocode.split(',').map(Number);
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
    <div className="book-result-item">
      <div className="book-header">
        {/* 書籍画像 */}
        {book.imageUrl && (
          <div className="book-image">
            <img 
              src={book.imageUrl} 
              alt={book.title}
              onError={(e) => e.target.style.display = 'none'}
            />
          </div>
        )}
        
        <div className="book-info">
          <h4 className="book-title">{book.title || 'タイトル不明'}</h4>
          <p className="book-isbn">
            <MenuBook fontSize="small" style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} />
            ISBN: {book.isbn}
          </p>
          
          {/* 書籍の詳細情報 */}
          {book.author && (
            <p className="book-author">
              <Person fontSize="small" style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} />
              著者: {book.author}
            </p>
          )}
          {book.publisher && (
            <p className="book-publisher">
              <Domain fontSize="small" style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} />
              出版社: {book.publisher}
            </p>
          )}
          {(book.pubdate || book.publishDate) && (
            <p className="book-pubdate">
              <CalendarToday fontSize="small" style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} />
              出版日: {book.pubdate || book.publishDate}
            </p>
          )}
          
          {/* 楽天Books情報 */}
          {book.reviewAverage && (
            <p className="book-review">
              <Star fontSize="small" style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} />
              評価: {book.reviewAverage} ({book.reviewCount}件)
            </p>
          )}
          {book.price && (
            <p className="book-price">
              <AttachMoney fontSize="small" style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} />
              価格: ¥{book.price.toLocaleString()}
            </p>
          )}
          <div className="availability-summary">
            {book.isLibraryDataLoaded ? (
              <>
                <span className="total-libraries">
                  <Business fontSize="small" style={{ marginRight: '4px' }} />
                  {getTotalLibrariesCount(book.systems, libraries, userLocation)}館中
                </span>
                <span className="available-libraries">
                  <CheckCircle fontSize="small" style={{ marginRight: '4px' }} />
                  {getAvailableCount(book.systems, libraries, userLocation)}館で貸出可
                </span>
              </>
            ) : (
              <>
                <span className="library-data-pending">
                  <LibraryBooks fontSize="small" style={{ marginRight: '4px' }} />
                  蔵書情報は「もっと読み込む」で確認できます
                </span>
                {!book.isLibraryDataLoading && (
                  <button
                    className="load-library-data-button"
                    onClick={() => onLoadLibraryData(book.isbn)}
                    disabled={book.isLibraryDataLoading}
                  >
                    <CloudDownload fontSize="small" style={{ marginRight: '4px' }} />
                    蔵書情報を読み込む
                  </button>
                )}
                {book.isLibraryDataLoading && (
                  <Box display="flex" alignItems="center" mt={1}>
                    <CircularProgress size={16} sx={{ mr: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      蔵書情報を取得中...
                    </Typography>
                  </Box>
                )}
              </>
            )}
          </div>
          
          {/* 楽天Books購入リンク */}
          {book.itemUrl && (
            <div className="book-actions">
              <a 
                href={book.itemUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="rakuten-link"
              >
                <ShoppingCart fontSize="small" style={{ marginRight: '4px' }} />
                楽天で購入
              </a>
            </div>
          )}
        </div>
      </div>

      {book.isLibraryDataLoaded && Object.keys(book.systems).length > 0 && (
        <div className="library-systems">
          {(() => {
            // 個々の図書館レベルで蔵書情報を展開し、距離順にソート
            const individualLibrariesWithBooks = [];

            Object.entries(book.systems).forEach(([systemId, systemData]) => {
              if (!systemData.libkey) return;

              // 各図書館支店の蔵書情報を個別に処理
              Object.entries(systemData.libkey).forEach(([branchName, status]) => {
                // 蔵書がある場合のみ処理
                if (status === '貸出可' || status === '館内のみ' || status === '予約可' || status === '貸出中') {
                  // 対応する個別図書館を検索
                  const individualLibrary = libraries.find(lib => {
                    // systemidの一致をチェック
                    const systemMatch = lib.systemid === systemId || lib.id === systemId;
                    // 図書館名の一致もチェック（より正確なマッチング）
                    const nameMatch = lib.name === branchName || lib.shortName === branchName;
                    return systemMatch && (nameMatch || branchName.includes(lib.shortName) || lib.shortName.includes(branchName));
                  });

                  let distance = null;
                  if (individualLibrary && userLocation) {
                    const [lng, lat] = individualLibrary.geocode.split(',').map(Number);
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
                    systemName: systemData.systemName || systemId
                  });
                }
              });
            });

            // 距離順にソート（すべて距離が設定されているため、シンプルなソート）
            individualLibrariesWithBooks.sort((a, b) => a.distance - b.distance);

            return individualLibrariesWithBooks.map(({ 
              systemId, 
              systemData, 
              branchName, 
              status, 
              library, 
              distance, 
              systemName 
            }, index) => {
              const statusInfo = getAvailabilityStatus(status);
              const uniqueKey = `${systemId}-${branchName}-${index}`;

              return (
                <div key={uniqueKey} className="individual-library">
                  <div className="library-header">
                    <div className="library-info">
                      <h5 className="library-name">{branchName}</h5>
                      <span className="library-system">{systemName}</span>
                    </div>
                    <div className="library-status-distance">
                      <span className={`library-status ${statusInfo.class}`}>
                        {statusInfo.icon} {statusInfo.text}
                      </span>
                      <span className="library-distance">
                        <LocationOn fontSize="small" style={{ marginRight: '2px' }} />
                        {distance}km
                      </span>
                    </div>
                  </div>

                  {library && (
                    <div className="library-details">
                      {library.address && (
                        <p className="library-address">
                          <LocationOn fontSize="small" style={{ marginRight: '4px', verticalAlign: 'text-bottom' }} />
                          {library.address}
                        </p>
                      )}
                      {library.tel && (
                        <p className="library-tel">
                          <Phone fontSize="small" style={{ marginRight: '4px', verticalAlign: 'text-bottom' }} />
                          {library.tel}
                        </p>
                      )}
                    </div>
                  )}

                  {systemData.reserveurl && (
                    <div className="library-actions">
                      <a 
                        href={systemData.reserveurl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="reserve-link"
                      >
                        <Link fontSize="small" style={{ marginRight: '4px' }} />
                        予約・詳細を見る
                      </a>
                    </div>
                  )}
                </div>
              );
            });
          })()}
        </div>
      )}
    </div>
  );
};

export default BookSearchResults;
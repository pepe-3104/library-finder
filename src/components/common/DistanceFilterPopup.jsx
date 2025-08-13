import React, { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  DirectionsWalk,
  DirectionsBike,
  DirectionsCar,
  DirectionsBus,
  Close,
  Tune
} from '@mui/icons-material';
import { CATEGORY_FILTER_OPTIONS, countLibrariesByCategory } from '../../utils/libraryCategoryFilter';
import './DistanceFilterPopup.css';

const DistanceFilterPopup = ({ 
  selectedDistance, 
  onDistanceChange, 
  libraryCount,
  categoryFilter,
  onCategoryFilterChange,
  allLibraries = [],
  isOpen, 
  onClose 
}) => {
  const popupRef = useRef(null);
  const [tempCategoryFilter, setTempCategoryFilter] = useState(categoryFilter || {});

  const distanceOptions = [
    { value: 1, label: '1km以内', icon: <DirectionsWalk /> },
    { value: 2, label: '2km以内', icon: <DirectionsBike /> },
    { value: 5, label: '5km以内', icon: <DirectionsCar /> },
    { value: 10, label: '10km以内', icon: <DirectionsBus /> }
  ];

  // 図書館カテゴリ別統計を計算
  const categoryStats = countLibrariesByCategory(allLibraries);

  // 外側クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen, onClose]);

  // ESCキーで閉じる
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
      return () => {
        document.removeEventListener('keydown', handleEscKey);
      };
    }
  }, [isOpen, onClose]);

  // フィルタ更新時にtempStateも同期
  useEffect(() => {
    setTempCategoryFilter(categoryFilter || {});
  }, [categoryFilter]);

  const handleDistanceSelect = (distance) => {
    onDistanceChange(distance);
    onClose();
  };

  const handleCategoryToggle = (category) => {
    const newFilter = {
      ...tempCategoryFilter,
      [category]: !tempCategoryFilter[category]
    };
    setTempCategoryFilter(newFilter);
  };

  const applyCategoryFilter = () => {
    onCategoryFilterChange(tempCategoryFilter);
    onClose();
  };

  const resetFilters = () => {
    const defaultFilter = { LARGE: true, MEDIUM: true, SMALL: true, UNIV: false, SPECIAL: true };
    setTempCategoryFilter(defaultFilter);
    onCategoryFilterChange(defaultFilter);
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="distance-filter-overlay">
      <div className="distance-filter-popup" ref={popupRef}>
        <div className="popup-header">
          <h3>
            <Tune fontSize="small" style={{ marginRight: '8px', verticalAlign: 'text-bottom' }} />
            表示フィルタ
          </h3>
          <button className="close-button" onClick={onClose}>
            <Close fontSize="small" />
          </button>
        </div>
        
        <div className="popup-content">
          {/* 距離フィルタセクション */}
          <section className="filter-section">
            <h4 className="section-title">距離範囲</h4>
            <p className="filter-description">
              表示する図書館の距離範囲を選択してください
            </p>
            
            <div className="current-status">
              <span className="status-label">現在の設定:</span>
              <span className="status-value">{selectedDistance}km以内</span>
              <span className="library-count">{libraryCount}件表示中</span>
            </div>
            
            <div className="distance-options">
              {distanceOptions.map(option => (
                <button
                  key={option.value}
                  className={`distance-option ${selectedDistance === option.value ? 'selected' : ''}`}
                  onClick={() => handleDistanceSelect(option.value)}
                >
                  <span className="option-icon">{option.icon}</span>
                  <span className="option-label">{option.label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* カテゴリフィルタセクション */}
          <section className="filter-section category-filter-section">
            <h4 className="section-title">図書館種類</h4>
            <p className="filter-description">
              表示する図書館の種類を選択してください（大学図書館はデフォルトで除外）
            </p>

            <div className="category-stats">
              <span className="stats-label">検索対象：</span>
              {CATEGORY_FILTER_OPTIONS.map(option => (
                categoryStats[option.category] > 0 && (
                  <span key={option.category} className="category-stat">
                    <span style={{ color: option.color }}>{option.icon}</span>
                    {categoryStats[option.category]}件
                  </span>
                )
              ))}
            </div>

            <div className="category-options">
              {CATEGORY_FILTER_OPTIONS.map(option => (
                <label
                  key={option.category}
                  className={`category-option ${tempCategoryFilter[option.category] ? 'enabled' : 'disabled'}`}
                >
                  <div className="category-header">
                    <input
                      type="checkbox"
                      checked={tempCategoryFilter[option.category] || false}
                      onChange={() => handleCategoryToggle(option.category)}
                      className="category-checkbox"
                    />
                    <span className="category-icon" style={{ color: option.color }}>
                      {option.icon}
                    </span>
                    <span className="category-label">{option.label}</span>
                    <span className="category-count">({categoryStats[option.category] || 0}件)</span>
                  </div>
                  <p className="category-description">{option.description}</p>
                </label>
              ))}
            </div>

            <div className="filter-actions">
              <button className="apply-button" onClick={applyCategoryFilter}>
                フィルタを適用
              </button>
              <button className="reset-button" onClick={resetFilters}>
                デフォルトに戻す
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default DistanceFilterPopup;
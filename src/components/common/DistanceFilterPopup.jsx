import React, { useState, useRef, useEffect } from 'react';
import {
  DirectionsWalk,
  DirectionsBike,
  DirectionsCar,
  DirectionsBus,
  Close
} from '@mui/icons-material';
import './DistanceFilterPopup.css';

const DistanceFilterPopup = ({ 
  selectedDistance, 
  onDistanceChange, 
  libraryCount, 
  isOpen, 
  onClose 
}) => {
  const popupRef = useRef(null);

  const distanceOptions = [
    { value: 1, label: '1km以内', icon: <DirectionsWalk /> },
    { value: 2, label: '2km以内', icon: <DirectionsBike /> },
    { value: 5, label: '5km以内', icon: <DirectionsCar /> },
    { value: 10, label: '10km以内', icon: <DirectionsBus /> }
  ];

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

  const handleDistanceSelect = (distance) => {
    onDistanceChange(distance);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="distance-filter-overlay">
      <div className="distance-filter-popup" ref={popupRef}>
        <div className="popup-header">
          <h3>距離フィルタ</h3>
          <button className="close-button" onClick={onClose}>
            <Close fontSize="small" />
          </button>
        </div>
        
        <div className="popup-content">
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
        </div>
      </div>
    </div>
  );
};

export default DistanceFilterPopup;
import React from 'react'
import './LoadingOverlay.css'

const LoadingOverlay = ({ isLoading }) => {
  if (!isLoading) return null

  return (
    <div className="loading-overlay">
      <div className="loading-content">
        <div className="loading-spinner">
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
          <div className="music-icon">🎵</div>
        </div>
        <p className="loading-text">加载中...</p>
      </div>
    </div>
  )
}

export default LoadingOverlay
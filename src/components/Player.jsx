import { useState, useEffect, useRef } from 'react'
import './Player.css'

function Player({
  currentSong,
  isPlaying,
  currentTime,
  duration,
  volume,
  onPlayPause,
  onNext,
  onPrevious,
  onSeek,
  onVolumeChange
}) {
  const [isDragging, setIsDragging] = useState(false)
  const [showVolume, setShowVolume] = useState(false)
  const progressRef = useRef(null)
  const volumeRef = useRef(null)

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00'
    const mins = Math.floor(time / 60)
    const secs = Math.floor(time % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleProgressClick = (e) => {
    if (!progressRef.current || !duration) return
    const rect = progressRef.current.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    const newTime = percent * duration
    onSeek(newTime)
  }

  const handleProgressDrag = (e) => {
    if (!isDragging || !progressRef.current || !duration) return
    const rect = progressRef.current.getBoundingClientRect()
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const newTime = percent * duration
    onSeek(newTime)
  }

  const handleVolumeChange = (e) => {
    if (!volumeRef.current) return
    const rect = volumeRef.current.getBoundingClientRect()
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    onVolumeChange(percent)
  }

  useEffect(() => {
    const handleMouseUp = () => setIsDragging(false)
    const handleMouseMove = (e) => {
      if (isDragging) {
        handleProgressDrag(e)
      }
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging])

  const progressPercent = duration ? (currentTime / duration) * 100 : 0
  const volumePercent = volume * 100

  const getVolumeIcon = () => {
    if (volume === 0) return '🔇'
    if (volume < 0.5) return '🔉'
    return '🔊'
  }

  if (!currentSong) {
    return (
      <div className="player player-empty">
        <div className="player-hint">
          <span className="hint-icon">🎵</span>
          <span>选择一首歌曲开始播放</span>
        </div>
      </div>
    )
  }

  return (
    <div className="player">
      <div className="player-container">
        {/* Song Info Section */}
        <div className="player-song-info">
          <img
            src={currentSong.cover}
            alt={currentSong.title}
            className="player-cover"
            onError={(e) => {
              console.error('播放器封面加载失败:', currentSong.cover)
              e.target.src = 'https://via.placeholder.com/100x100/667eea/ffffff?text=No+Cover'
            }}
          />
          <div className="player-text-info">
            <h4 className="player-song-title">{currentSong.title}</h4>
            <p className="player-song-artist">{currentSong.artist}</p>
          </div>
        </div>

        {/* Controls Section */}
        <div className="player-controls-section">
          <div className="player-controls">
            <button className="control-btn" onClick={onPrevious} title="上一首">
              ⏮
            </button>
            <button
              className="control-btn control-btn-play"
              onClick={onPlayPause}
              title={isPlaying ? '暂停' : '播放'}
            >
              {isPlaying ? '⏸' : '▶'}
            </button>
            <button className="control-btn" onClick={onNext} title="下一首">
              ⏭
            </button>
          </div>

          <div className="player-progress-section">
            <span className="player-time">{formatTime(currentTime)}</span>
            <div
              ref={progressRef}
              className="player-progress"
              onClick={handleProgressClick}
              onMouseDown={() => setIsDragging(true)}
            >
              <div className="player-progress-bar" style={{ width: `${progressPercent}%` }}>
                <div className="player-progress-handle" />
              </div>
            </div>
            <span className="player-time">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Volume Section */}
        <div
          className="player-volume-section"
          onMouseEnter={() => setShowVolume(true)}
          onMouseLeave={() => setShowVolume(false)}
        >
          <button className="volume-btn" title="音量">
            {getVolumeIcon()}
          </button>
          <div className={`volume-slider ${showVolume ? 'visible' : ''}`}>
            <div
              ref={volumeRef}
              className="volume-track"
              onClick={handleVolumeChange}
            >
              <div className="volume-bar" style={{ width: `${volumePercent}%` }}>
                <div className="volume-handle" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Player

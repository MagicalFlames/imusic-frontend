import './Favorites.css'

function Favorites({ favorites, onPlay, onRemove, currentSong }) {
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (favorites.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">💔</div>
        <p className="empty-text">还没有收藏的歌曲</p>
        <p className="empty-hint">在搜索页面添加你喜欢的歌曲吧！</p>
      </div>
    )
  }

  return (
    <div className="favorites">
      <div className="favorites-header">
        <h2 className="section-title">我的收藏</h2>
        <div className="favorites-stats">
          <span className="stat-item">
            <span className="stat-icon">🎵</span>
            {favorites.length} 首歌曲
          </span>
          <span className="stat-item">
            <span className="stat-icon">⏱</span>
            {Math.floor(favorites.reduce((acc, song) => acc + song.duration, 0) / 60)} 分钟
          </span>
        </div>
      </div>

      <div className="favorites-list">
        {favorites.map((song, index) => (
          <div
            key={song.id}
            className={`favorite-item ${currentSong?.id === song.id ? 'playing' : ''}`}
          >
            <div className="favorite-index">{index + 1}</div>
            <div className="favorite-cover-wrapper">
              <img
                src={song.cover}
                alt={song.title}
                className="favorite-cover"
                onError={(e) => {
                  console.error('收藏封面加载失败:', song.cover)
                  e.target.src = 'https://via.placeholder.com/100x100/667eea/ffffff?text=No+Cover'
                }}
              />
              <button
                className="favorite-play-btn"
                onClick={() => onPlay(song)}
              >
                {currentSong?.id === song.id ? '⏸' : '▶'}
              </button>
            </div>
            <div className="favorite-details">
              <div className="favorite-main-info">
                <h3 className="favorite-title">{song.title}</h3>
                <p className="favorite-artist">{song.artist}</p>
              </div>
              <p className="favorite-album">{song.album}</p>
            </div>
            <div className="favorite-duration">{formatDuration(song.duration)}</div>
            <button
              className="remove-btn"
              onClick={() => onRemove(song)}
              title="从收藏中移除"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="play-all-section">
        <button
          className="play-all-btn"
          onClick={() => favorites.length > 0 && onPlay(favorites[0])}
        >
          <span className="play-all-icon">▶</span>
          播放全部
        </button>
      </div>
    </div>
  )
}

export default Favorites

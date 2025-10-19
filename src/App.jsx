import { useState, useRef, useEffect } from 'react'
import SearchBar from './components/SearchBar'
import SongList from './components/SongList'
import Favorites from './components/Favorites'
import Player from './components/Player'
import Login from './components/Login'
import LoadingOverlay from './components/LoadingOverlay'
import Toast, { showToast } from './components/Toast'
import { BASE_URL } from './config'
import './App.css'

function App() {
  const [songs, setSongs] = useState([])
  const [favorites, setFavorites] = useState([])
  const [currentSong, setCurrentSong] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.7)
  const [activeTab, setActiveTab] = useState('search')
  const [showLogin, setShowLogin] = useState(false)
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const audioRef = useRef(null)

  // 页面加载时检查 LocalStorage 并恢复登录
  useEffect(() => {
    const restoreLogin = async () => {
      const username = localStorage.getItem('username')
      const password = localStorage.getItem('password')
      const isLoggedIn = localStorage.getItem('isLoggedIn')

      if (isLoggedIn === 'true' && username && password) {
        setIsLoading(true)
        try {
          // 调用登录接口恢复 session
          const response = await fetch(`${BASE_URL}/api/user/login/password`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
            credentials: 'include'
          })

          const data = await response.json()

          if (data.success) {
            // 恢复登录成功
            setUser({ username })
          } else {
            // 登录失败，清除本地存储
            localStorage.removeItem('username')
            localStorage.removeItem('password')
            localStorage.removeItem('isLoggedIn')
          }
        } catch (error) {
          console.error('恢复登录失败:', error)
          localStorage.removeItem('username')
          localStorage.removeItem('password')
          localStorage.removeItem('isLoggedIn')
        } finally {
          setIsLoading(false)
        }
      }
    }

    restoreLogin()
  }, [])

  // 获取收藏列表
  const fetchFavorites = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const response = await fetch(`${BASE_URL}/api/song/search/insonglist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ listName: 'favorite' }),
        credentials: 'include'
      })

      const data = await response.json()

      if (data.success && data.message && data.message.songs) {
        const songs = data.message.songs.map((song, index) => {
          const coverPath = song.coverFilePath?.startsWith('http')
            ? song.coverFilePath
            : `${BASE_URL}/${song.coverFilePath}`

          const filePath = song.filePath?.startsWith('http')
            ? song.filePath
            : `${BASE_URL}/${song.filePath}`

          return {
            id: `fav_${index}`,
            title: song.title,
            artist: song.albumArtist || song.artist,
            album: song.album,
            duration: parseDuration(song.duration),
            cover: coverPath,
            url: filePath
          }
        })
        setFavorites(songs)
      } else {
        setFavorites([])
      }
    } catch (error) {
      console.error('获取收藏失败:', error)
      setFavorites([])
    } finally {
      setIsLoading(false)
    }
  }

  // 切换到收藏标签时获取收藏列表
  useEffect(() => {
    if (activeTab === 'favorites' && user) {
      fetchFavorites()
    }
  }, [activeTab, user])

  const handleSearch = async (query) => {
    setIsLoading(true)
    try {
      const response = await fetch(`${BASE_URL}/api/song/search/all`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: query,
          albumArtist: query
        })
      })

      const data = await response.json()

      if (data.success && data.message && data.message.songs) {
        const songs = data.message.songs.map((song, index) => {
          // 处理封面路径 - 如果路径已经是完整URL则直接使用，否则添加前缀
          const coverPath = song.coverFilePath?.startsWith('http')
            ? song.coverFilePath
            : `${BASE_URL}/${song.coverFilePath}`

          const filePath = song.filePath?.startsWith('http')
            ? song.filePath
            : `${BASE_URL}/${song.filePath}`

          console.log('封面路径:', coverPath) // 调试信息

          return {
            id: index + 1, // 使用索引作为临时 ID
            title: song.title,
            artist: song.albumArtist || song.artist,
            album: song.album,
            duration: parseDuration(song.duration),
            cover: coverPath,
            url: filePath
          }
        })
        setSongs(songs)

        // 如果搜索结果为空，提示用户
        if (songs.length === 0) {
          showToast('未找到相关歌曲，试试其他关键词吧', 'info')
        }
      } else {
        setSongs([])
        showToast('未找到相关歌曲，试试其他关键词吧', 'info')
      }
    } catch (error) {
      console.error('搜索失败:', error)
      setSongs([])
      showToast('搜索失败，请检查网络连接', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  // 将时长字符串转换为秒数
  const parseDuration = (durationStr) => {
    if (!durationStr) return 0
    const parts = durationStr.split(':')
    if (parts.length === 2) {
      return parseInt(parts[0]) * 60 + parseInt(parts[1])
    } else if (parts.length === 3) {
      return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2])
    }
    return 0
  }

  const addToFavorites = async (song) => {
    // 检查是否登录
    if (!user) {
      showToast('请先登录', 'warning')
      setShowLogin(true)
      return
    }

    // 检查是否已收藏
    if (favorites.find(fav => fav.title === song.title && fav.artist === song.artist)) {
      showToast('已经收藏过该歌曲', 'info')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`${BASE_URL}/api/song/add/tosonglist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: song.title,
          albumArtist: song.artist,
          album: song.album,
          listName: 'favorite'
        }),
        credentials: 'include'
      })

      const data = await response.json()

      if (data.success) {
        // 添加成功，刷新收藏列表
        await fetchFavorites()
        showToast('已添加到收藏', 'success')
      } else {
        showToast(data.message?.error || '添加失败', 'error')
      }
    } catch (error) {
      console.error('添加到收藏失败:', error)
      showToast('网络错误，请稍后重试', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const removeFromFavorites = async (song) => {
    // 检查是否登录
    if (!user) {
      showToast('请先登录', 'warning')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`${BASE_URL}/api/song/delete/fromsonglist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: song.title,
          albumArtist: song.artist,
          album: song.album,
          listName: 'favorite'
        }),
        credentials: 'include'
      })

      const data = await response.json()

      if (data.success) {
        // 删除成功，刷新收藏列表
        await fetchFavorites()
        showToast('已从收藏中移除', 'success')
      } else {
        showToast(data.message?.error || '删除失败', 'error')
      }
    } catch (error) {
      console.error('删除收藏失败:', error)
      showToast('网络错误，请稍后重试', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const playSong = (song) => {
    setCurrentSong(song)
    setIsPlaying(true)
  }

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const playNext = () => {
    if (favorites.length === 0) return
    const currentIndex = favorites.findIndex(song => song.id === currentSong?.id)
    const nextIndex = (currentIndex + 1) % favorites.length
    playSong(favorites[nextIndex])
  }

  const playPrevious = () => {
    if (favorites.length === 0) return
    const currentIndex = favorites.findIndex(song => song.id === currentSong?.id)
    const prevIndex = currentIndex <= 0 ? favorites.length - 1 : currentIndex - 1
    playSong(favorites[prevIndex])
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
    }
  }

  const handleSeek = (time) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time
      setCurrentTime(time)
    }
  }

  const handleVolumeChange = (newVolume) => {
    setVolume(newVolume)
    if (audioRef.current) {
      audioRef.current.volume = newVolume
    }
  }

  const handleEnded = () => {
    playNext()
  }

  // 登录成功处理
  const handleLoginSuccess = (userData) => {
    setUser({ username: userData.username })
    showToast(`欢迎回来，${userData.username}！`, 'success')
  }

  // 登出处理
  const handleLogout = () => {
    // 清空 LocalStorage
    localStorage.removeItem('username')
    localStorage.removeItem('password')
    localStorage.removeItem('isLoggedIn')

    // 清空用户状态和收藏列表
    setUser(null)
    setFavorites([])

    // 如果当前在收藏页面，切换回搜索页面
    if (activeTab === 'favorites') {
      setActiveTab('search')
    }

    showToast('已登出', 'info')
  }

  useEffect(() => {
    if (audioRef.current && currentSong) {
      audioRef.current.play()
    }
  }, [currentSong])

  return (
    <div className="app">
      <div className="app-header">
        <div className="header-left">
          <h1 className="app-title">🎵 IMusic</h1>
        </div>

        <div className="header-center">
          <div className="tab-navigation">
            <button
              className={`tab-btn ${activeTab === 'search' ? 'active' : ''}`}
              onClick={() => setActiveTab('search')}
            >
              搜索
            </button>
            <button
              className={`tab-btn ${activeTab === 'favorites' ? 'active' : ''}`}
              onClick={() => setActiveTab('favorites')}
            >
              我的收藏
            </button>
          </div>
        </div>

        <div className="header-right">
          {user ? (
            <div className="user-info">
              <span className="username">👤 {user.username}</span>
              <button className="logout-btn" onClick={handleLogout}>
                登出
              </button>
            </div>
          ) : (
            <button className="login-btn" onClick={() => setShowLogin(true)}>
              登录
            </button>
          )}
        </div>
      </div>

      <div className="app-content">
        {activeTab === 'search' ? (
          <div className="search-section">
            <SearchBar onSearch={handleSearch} />
            <SongList
              songs={songs}
              favorites={favorites}
              onPlay={playSong}
              onAddToFavorites={addToFavorites}
              currentSong={currentSong}
            />
          </div>
        ) : (
          <Favorites
            favorites={favorites}
            onPlay={playSong}
            onRemove={removeFromFavorites}
            currentSong={currentSong}
          />
        )}
      </div>

      <Player
        currentSong={currentSong}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        onPlayPause={togglePlay}
        onNext={playNext}
        onPrevious={playPrevious}
        onSeek={handleSeek}
        onVolumeChange={handleVolumeChange}
      />

      <audio
        ref={audioRef}
        src={currentSong?.url}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />

      {showLogin && (
        <Login
          onClose={() => setShowLogin(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

      <LoadingOverlay isLoading={isLoading} />
      <Toast />
    </div>
  )
}

export default App

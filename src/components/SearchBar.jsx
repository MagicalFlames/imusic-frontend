import { useState,useEffect} from 'react'
import './SearchBar.css'

function SearchBar({ onSearch }) {
  const [query, setQuery] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (query.trim()) {
      onSearch(query)
    }
  }
    useEffect(() => {
        setQuery('')  // 清空输入框的状态
        onSearch('')
    }, [])

    return (
    <div className="search-bar">
      <form onSubmit={handleSubmit} className="search-form">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="搜索歌曲、艺术家"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button
              type="button"
              className="clear-btn"
              onClick={() => {
                setQuery('')
                onSearch('')
              }}
            >
              ✕
            </button>
          )}
        </div>
        <button type="submit" className="search-btn">
          搜索
        </button>
      </form>
    </div>
  )
}

export default SearchBar

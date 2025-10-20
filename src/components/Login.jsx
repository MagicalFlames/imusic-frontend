import { useState } from 'react'
import { BASE_URL, OAUTH_CONFIG } from '../config'
import LoadingOverlay from './LoadingOverlay'
import { showToast } from './Toast'
import './Login.css'

function Login({ onClose, onLoginSuccess }) {
  const [mode, setMode] = useState('login') // 'login', 'register'
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [cfAuthenticated, setCfAuthenticated] = useState(false) // 标记是否已通过 CF 认证
  const [isLoading, setIsLoading] = useState(false)

  // 账号密码登录
  const handlePasswordLogin = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
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
        // 保存到 LocalStorage
        localStorage.setItem('username', username)
        localStorage.setItem('password', password)
        localStorage.setItem('isLoggedIn', 'true')

        onLoginSuccess({ username, password })
        onClose()
      } else {
        setError(data.message?.error || '登录失败')
      }
    } catch (err) {
      console.error('登录错误:', err)
      setError('网络错误，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }

  // 注册（仅在 CF 认证后可用）
  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')

    if (!cfAuthenticated) {
      setError('请先通过 CodeForces 认证')
      return
    }

    setIsLoading(true)
    try {
      // 1. 注册
      const response = await fetch(`${BASE_URL}/api/user/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
        credentials: 'include'
      })

      const data = await response.json()

      if (data.success) {
        // 2. 注册成功后调用登录接口来创建 session，以便创建歌单
        try {
          const loginResponse = await fetch(`${BASE_URL}/api/user/login/password`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
            credentials: 'include'
          })

          const loginData = await loginResponse.json()

          if (loginData.success) {
            // 3. 登录成功后创建 favorite 歌单
            try {
              await fetch(`${BASE_URL}/api/user/songLists/add`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ listName: 'favorite' }),
                credentials: 'include'
              })
            } catch (err) {
              console.error('创建 favorite 歌单失败:', err)
            }
          }
        } catch (err) {
          console.error('创建歌单失败:', err)
        }

        // 4. 注册成功，切换到登录页面让用户手动登录
        setCfAuthenticated(false)
        setMode('login')
        setUsername('')
        setPassword('')
        setError('')
        showToast('注册成功！请使用您的账号密码登录', 'success')
      } else {
        setError(data.message?.error || '注册失败')
      }
    } catch (err) {
      console.error('注册错误:', err)
      setError('网络错误，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }

  // 第三方认证 - CodeForces
  const handleCodeforcesLogin = () => {
    const { clientId, redirectUri, authorizeUrl, scope } = OAUTH_CONFIG.codeforces
    const url = `${authorizeUrl}?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`

    window.open(url, 'OAuth Login', 'width=600,height=700')

    // 监听来自 OAuth 回调的消息
    const messageHandler = async (event) => {
      if (event.data.type === 'auth_code') {
        const code = event.data.code
        setIsLoading(true)

        try {
          const response = await fetch(`${BASE_URL}/api/user/certificate/codeforces/?code=${encodeURIComponent(code)}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            },
            credentials: 'include'
          })

          const data = await response.json()

          if (data.success) {
            // CodeForces 认证成功，跳转到注册页面让用户创建账号
            setCfAuthenticated(true)
            setMode('register')
            setUsername('')
            setPassword('')
            setError('')
          } else {
            setError(data.message?.error || 'CodeForces 认证失败')
          }
        } catch (err) {
          console.error('CodeForces 认证错误:', err)
          setError('网络错误，请稍后重试')
        } finally {
          setIsLoading(false)
        }

        // 移除事件监听
        window.removeEventListener('message', messageHandler)
      }
    }

    window.addEventListener('message', messageHandler)
  }

  return (
    <>
      <div className="login-overlay" onClick={isLoading ? undefined : onClose}></div>
      <div className="login-popup">
        <LoadingOverlay isLoading={isLoading} />
        <button className="login-close" onClick={isLoading ? undefined : onClose} disabled={isLoading}>✕</button>

        <div className="login-content">
          <h2 className="login-title">
            {mode === 'login' ? '登录' : '创建账号'}
          </h2>
          <p className="login-desc">
            {mode === 'login'
              ? '请输入用户名和密码登录'
              : '通过 CodeForces 认证成功！请设置您的用户名和密码'}
          </p>

          <form className="login-form" onSubmit={mode === 'login' ? handlePasswordLogin : handleRegister}>
            <div className="login-input-group">
              <input
                className="login-input"
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder=" "
                required
              />
              <label className="login-label" htmlFor="username">用户名</label>
            </div>

            <div className="login-input-group">
              <input
                className="login-input"
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder=" "
                required
              />
              <label className="login-label" htmlFor="password">密码</label>
            </div>

            {error && <div className="login-error">{error}</div>}

            <button type="submit" className="login-submit">
              {mode === 'login' ? '登录' : '创建账号'} →
            </button>
          </form>

          {mode === 'login' && (
            <>
              <div className="login-divider">
                <span>没有账号？使用 CodeForces 认证来注册账号</span>
              </div>

              <div className="login-third-party">
                <button className="third-party-btn codeforces-btn" onClick={handleCodeforcesLogin}>
                  <img
                    src="/codeforces.png"
                    alt="CodeForces"
                    className="codeforces-logo"
                  />
                  <span>CodeForces 认证</span>
                </button>
              </div>

              <div className="login-hint">
                💡 首次使用？请先通过 CodeForces 认证创建账号
              </div>
            </>
          )}

          {mode === 'register' && (
            <div className="register-notice">
              ✅ 已通过 CodeForces 认证
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default Login

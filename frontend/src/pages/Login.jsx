import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Stethoscope, Eye, EyeOff, LogIn } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!username.trim() || !password) {
      setError('يرجى إدخال اسم المستخدم وكلمة المرور.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const role = await login(username.trim(), password)
      navigate(role === 'doctor' ? '/doctor' : '/assistant', { replace: true })
    } catch (err) {
      let msg = 'فشل تسجيل الدخول. تأكد من اسم المستخدم وكلمة المرور.'
      if (err.status === 401) {
        msg = 'اسم المستخدم أو كلمة المرور غير صحيحة.'
      } else if (err.status === 422) {
        msg = 'بيانات غير صالحة. يرجى المحاولة مرة أخرى.'
      }
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4 font-cairo">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-500 rounded-3xl shadow-lg mb-4">
            <Stethoscope className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold text-gray-800">عيادة الأسنان</h1>
          <p className="text-xl text-gray-500 mt-1">نظام إدارة المواعيد</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">تسجيل الدخول</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-lg font-bold text-gray-700 mb-2">اسم المستخدم</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="أدخل اسم المستخدم"
                className="w-full px-5 py-4 text-xl rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition text-right"
                dir="auto"
              />
            </div>

            <div>
              <label className="block text-lg font-bold text-gray-700 mb-2">كلمة المرور</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-5 py-4 text-xl rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition text-right"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-100 text-red-800 text-lg font-bold px-5 py-4 rounded-2xl border border-red-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white text-2xl font-bold py-5 px-6 rounded-2xl shadow-lg flex items-center justify-center gap-3 transition"
            >
              {submitting ? (
                <span>جاري تسجيل الدخول...</span>
              ) : (
                <>
                  <LogIn className="w-7 h-7" />
                  <span>دخول</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

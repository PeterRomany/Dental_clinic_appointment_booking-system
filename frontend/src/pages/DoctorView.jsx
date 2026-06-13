import { useState, useEffect, useCallback, useRef } from 'react'
import { CalendarDays, RefreshCw, AlertCircle, CheckCircle, XCircle, Stethoscope, Frown } from 'lucide-react'
import AppointmentCard from '../components/AppointmentCard'
import EditAppointmentModal from '../components/EditAppointmentModal'
import { getScheduleAppointments, getPendingAppointments, updateAppointmentStatus } from '../api/appointments'

function formatDateArabic(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  const today = new Date()
  const isToday = d.toDateString() === today.toDateString()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const isTomorrow = d.toDateString() === tomorrow.toDateString()
  const label = isToday ? 'اليوم' : isTomorrow ? 'غداً' : ''
  const dateLabel = d.toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  return label ? `${label} — ${dateLabel}` : dateLabel
}

export default function DoctorView() {
  const [schedule, setSchedule] = useState([])
  const [pendingAppts, setPendingAppts] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionMsg, setActionMsg] = useState(null)
  const [editingAppt, setEditingAppt] = useState(null)
  const toastTimer = useRef(null)

  const showToast = (msg) => {
    setActionMsg(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setActionMsg(null), 4000)
  }

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true)
      const today = new Date().toISOString().split('T')[0]
      const [sched, pending] = await Promise.all([
        getScheduleAppointments(today),
        getPendingAppointments(),
      ])
      setSchedule(sched)
      setPendingAppts(pending)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
    const interval = setInterval(fetchAll, 30000)
    return () => clearInterval(interval)
  }, [fetchAll])

  useEffect(() => {
    return () => { if (toastTimer.current) clearTimeout(toastTimer.current) }
  }, [])

  const doStatusUpdate = async (id, status, successMsg, errorMsg) => {
    try {
      await updateAppointmentStatus(id, status)
      showToast({ type: 'success', text: successMsg })
      await fetchAll()
    } catch (err) {
      const text = err.status === 409
        ? 'لقد تجاوزت الحد اليومي للمواعيد المؤكدة'
        : errorMsg
      showToast({ type: 'error', text })
    }
  }

  const handleApprove = (id) => doStatusUpdate(id, 'confirmed', 'تمت الموافقة على الحجز بنجاح', 'حدث خطأ أثناء الموافقة')
  const handleReject = (id) => doStatusUpdate(id, 'rejected', 'تم رفض الحجز', 'حدث خطأ أثناء الرفض')
  const handleAttend = (id) => doStatusUpdate(id, 'attended', 'تم تسجيل الكشف', 'حدث خطأ أثناء تسجيل الكشف')
  const handleNoShow = (id) => doStatusUpdate(id, 'no_show', 'تم تسجيل عدم الحضور', 'حدث خطأ أثناء التسجيل')

  const handleSaveEdit = async () => {
    await fetchAll()
  }

  // Group schedule by date
  const grouped = {}
  for (const a of schedule) {
    const d = a.appointment_date
    if (!grouped[d]) grouped[d] = []
    grouped[d].push(a)
  }
  const sortedDates = Object.keys(grouped).sort()

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white" dir="rtl">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <CalendarDays className="w-10 h-10 text-indigo-500" />
            <div>
              <h1 className="text-3xl font-extrabold text-gray-800">لوحة الطبيب</h1>
              <p className="text-lg text-gray-500">جدول المواعيد الكامل</p>
            </div>
          </div>
          <button onClick={fetchAll} className="p-3 bg-white rounded-full shadow hover:shadow-md transition">
            <RefreshCw className="w-6 h-6 text-indigo-500" />
          </button>
        </div>

        {/* Toast */}
        {actionMsg && (
          <div className={`mb-6 p-4 rounded-xl text-xl font-bold shadow-lg flex items-center gap-3 ${
            actionMsg.type === 'success'
              ? 'bg-green-100 text-green-800 border border-green-300'
              : actionMsg.type === 'error'
              ? 'bg-red-100 text-red-800 border border-red-300'
              : 'bg-blue-100 text-blue-800 border border-blue-300'
          }`}>
            {actionMsg.type === 'success' ? <CheckCircle className="w-6 h-6 flex-shrink-0" />
              : actionMsg.type === 'error' ? <XCircle className="w-6 h-6 flex-shrink-0" />
              : <AlertCircle className="w-6 h-6 flex-shrink-0" />}
            {actionMsg.text}
          </div>
        )}

        {/* Pending Requests Section */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="bg-yellow-400 p-2 rounded-xl">
              <AlertCircle className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-2xl font-extrabold text-gray-800">طلبات الحجز الإضافية</h2>
            {pendingAppts.length > 0 && (
              <span className="bg-red-500 text-white text-lg font-bold px-4 py-1 rounded-full">
                {pendingAppts.length}
              </span>
            )}
          </div>
          {pendingAppts.length === 0 ? (
            <div className="bg-white rounded-2xl shadow p-8 text-center">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-3" />
              <p className="text-2xl text-gray-500">لا توجد طلبات حجز إضافية</p>
            </div>
          ) : (
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-3xl p-6">
              <div className="grid gap-4 md:grid-cols-2">
                {pendingAppts.sort((a, b) => a.appointment_time.localeCompare(b.appointment_time)).map((a) => (
                  <AppointmentCard
                    key={a.id} appointment={a}
                    showActions onApprove={handleApprove} onReject={handleReject}
                    onEdit={setEditingAppt}
                  />
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Full Schedule grouped by date */}
        {loading ? (
          <div className="text-center text-2xl text-gray-400 py-16">جاري التحميل...</div>
        ) : sortedDates.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-10 text-center">
            <CalendarDays className="w-16 h-16 text-gray-300 mx-auto mb-3" />
            <p className="text-2xl text-gray-500">لا توجد مواعيد قادمة</p>
          </div>
        ) : (
          sortedDates.map((dateStr) => {
            const appts = grouped[dateStr].sort((a, b) => a.appointment_time.localeCompare(b.appointment_time))
            const confirmedCount = appts.filter((a) => a.status === 'confirmed').length
            return (
              <section key={dateStr} className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-extrabold text-gray-800">
                    {formatDateArabic(dateStr)}
                  </h3>
                  <span className="text-lg text-gray-500">
                    <span className="text-green-600 font-bold">{confirmedCount}</span> / 6 مؤكدة
                  </span>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {appts.map((a) => (
                    <AppointmentCard
                      key={a.id} appointment={a}
                      showActions={a.status === 'pending_approval'}
                      showDoctorActions={a.status === 'confirmed'}
                      onApprove={handleApprove} onReject={handleReject}
                      onAttend={handleAttend} onNoShow={handleNoShow}
                      onEdit={setEditingAppt}
                    />
                  ))}
                </div>
              </section>
            )
          })
        )}
      </div>

      {editingAppt && (
        <EditAppointmentModal
          appointment={editingAppt}
          onClose={() => setEditingAppt(null)}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  )
}

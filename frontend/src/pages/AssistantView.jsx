import { useState, useEffect, useCallback } from 'react'
import { PlusCircle, Stethoscope, RefreshCw, CalendarDays, AlertTriangle } from 'lucide-react'
import AppointmentCard from '../components/AppointmentCard'
import AddAppointmentModal from '../components/AddAppointmentModal'
import EditAppointmentModal from '../components/EditAppointmentModal'
import { getScheduleAppointments, createAppointment } from '../api/appointments'

function dateHeader(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  const today = new Date()
  const isToday = d.toDateString() === today.toDateString()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const isTomorrow = d.toDateString() === tomorrow.toDateString()

  const dateLabel = d.toLocaleDateString('ar-SA', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
  if (isToday) return `اليوم — ${dateLabel}`
  if (isTomorrow) return `غداً — ${dateLabel}`
  return dateLabel
}

export default function AssistantView() {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingAppt, setEditingAppt] = useState(null)
  const [alertMsg, setAlertMsg] = useState(null)

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true)
      const today = new Date().toISOString().split('T')[0]
      const data = await getScheduleAppointments(today)
      setAppointments(data)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAppointments()
  }, [fetchAppointments])

  const handleCreate = async (payload) => {
    const result = await createAppointment(payload)
    if (result.status === 'pending_approval') {
      setAlertMsg('لقد تجاوزت الحد اليومي للمواعيد المؤكدة، في انتظار موافقة الطبيب')
    }
    await fetchAppointments()
  }

  const handleSaveEdit = async () => {
    await fetchAppointments()
  }

  // Group by date, sort within each date by time
  const grouped = {}
  for (const a of appointments) {
    const d = a.appointment_date
    if (!grouped[d]) grouped[d] = []
    grouped[d].push(a)
  }
  const sortedDates = Object.keys(grouped).sort()

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Stethoscope className="w-10 h-10 text-blue-500" />
            <div>
              <h1 className="text-3xl font-extrabold text-gray-800">عيادة الأسنان</h1>
              <p className="text-lg text-gray-500">لوحة المساعد</p>
            </div>
          </div>
          <button
            onClick={fetchAppointments}
            className="p-3 bg-white rounded-full shadow hover:shadow-md transition"
          >
            <RefreshCw className="w-6 h-6 text-blue-500" />
          </button>
        </div>

        {/* Add Button */}
        <button
          onClick={() => setShowAddModal(true)}
          className="w-full bg-green-500 hover:bg-green-600 text-white text-2xl font-bold py-5 px-6 rounded-2xl shadow-lg flex items-center justify-center gap-3 transition mb-6"
        >
          <PlusCircle className="w-8 h-8" />
          حجز كشف جديد
        </button>

        {/* Alert Message */}
        {alertMsg && (
          <div className="mb-6 p-4 rounded-xl text-xl font-bold shadow-lg flex items-center gap-3 bg-orange-100 text-orange-800 border border-orange-300">
            <AlertTriangle className="w-7 h-7 flex-shrink-0" />
            <span>{alertMsg}</span>
            <button
              onClick={() => setAlertMsg(null)}
              className="mr-auto text-orange-600 hover:text-orange-800 text-2xl leading-none"
            >
              &times;
            </button>
          </div>
        )}

        {/* Appointments grouped by date */}
        {loading ? (
          <div className="text-center text-2xl text-gray-400 py-20">جاري التحميل...</div>
        ) : sortedDates.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-10 text-center">
            <CalendarDays className="w-16 h-16 text-blue-300 mx-auto mb-3" />
            <p className="text-2xl text-gray-500">لا توجد مواعيد قادمة</p>
            <p className="text-lg text-gray-400 mt-2">يمكنك حجز موعد جديد بالضغط على الزر أعلاه</p>
          </div>
        ) : (
          sortedDates.map((dateStr) => {
            const dayAppts = grouped[dateStr].sort((a, b) =>
              a.appointment_time.localeCompare(b.appointment_time)
            )
            const confirmed = dayAppts.filter((a) => a.status === 'confirmed')
            const pending = dayAppts.filter((a) => a.status === 'pending_approval')

            return (
              <section key={dateStr} className="mb-8">
                {/* Date header — massive, high contrast */}
                <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-4 mb-4 flex items-center justify-between">
                  <h2 className="text-2xl font-extrabold text-gray-800">
                    {dateHeader(dateStr)}
                  </h2>
                  <div className="flex items-center gap-4 text-lg text-gray-500">
                    <span className="text-green-700 font-bold">{confirmed.length}</span>
                    <span className="text-orange-700 font-bold">{pending.length}</span>
                  </div>
                </div>

                {dayAppts.length === 0 ? (
                  <p className="text-xl text-gray-400 text-center py-6">لا توجد حجوزات في هذا اليوم</p>
                ) : (
                  <div className="space-y-4">
                    {dayAppts.map((a) => (
                      <AppointmentCard
                        key={a.id}
                        appointment={a}
                        onEdit={setEditingAppt}
                      />
                    ))}
                  </div>
                )}
              </section>
            )
          })
        )}
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddAppointmentModal
          onClose={() => setShowAddModal(false)}
          onSubmit={handleCreate}
        />
      )}

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

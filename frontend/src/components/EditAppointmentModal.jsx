import { useState, useEffect } from 'react'
import { X, Calendar, User, Phone, Clock } from 'lucide-react'
import { checkSlotAvailability, updateAppointment } from '../api/appointments'

const TIME_SLOTS = [
  { value: '09:00', label: '٠٩:٠٠ صباحاً' },
  { value: '09:30', label: '٠٩:٣٠ صباحاً' },
  { value: '10:00', label: '١٠:٠٠ صباحاً' },
  { value: '10:30', label: '١٠:٣٠ صباحاً' },
  { value: '11:00', label: '١١:٠٠ صباحاً' },
  { value: '11:30', label: '١١:٣٠ صباحاً' },
  { value: '12:00', label: '١٢:٠٠ ظهراً' },
  { value: '12:30', label: '١٢:٣٠ مساءً' },
  { value: '13:00', label: '٠١:٠٠ مساءً' },
  { value: '13:30', label: '٠١:٣٠ مساءً' },
  { value: '14:00', label: '٠٢:٠٠ مساءً' },
  { value: '14:30', label: '٠٢:٣٠ مساءً' },
  { value: '15:00', label: '٠٣:٠٠ مساءً' },
  { value: '15:30', label: '٠٣:٣٠ مساءً' },
  { value: '16:00', label: '٠٤:٠٠ مساءً' },
  { value: '16:30', label: '٠٤:٣٠ مساءً' },
  { value: '17:00', label: '٠٥:٠٠ مساءً' },
]

export default function EditAppointmentModal({ appointment, onClose, onSave }) {
  const today = new Date().toISOString().split('T')[0]
  const [name, setName] = useState(appointment.patient_name)
  const [phone, setPhone] = useState(appointment.patient_phone)
  const [date, setDate] = useState(appointment.appointment_date)
  const [time, setTime] = useState(appointment.appointment_time)
  const [slotTaken, setSlotTaken] = useState(false)
  const [checking, setChecking] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!date || !time) { setSlotTaken(false); return }
    let cancelled = false
    setChecking(true)
    checkSlotAvailability(date, time, appointment.id).then((available) => {
      if (!cancelled) setSlotTaken(!available)
    }).catch(() => {}).finally(() => {
      if (!cancelled) setChecking(false)
    })
    return () => { cancelled = true }
  }, [date, time, appointment.id])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim() || !phone.trim() || !time || slotTaken || saving) return
    setSaving(true)
    setError('')
    try {
      await updateAppointment(appointment.id, {
        patient_name: name.trim(),
        patient_phone: phone.trim(),
        appointment_date: date,
        appointment_time: time,
      })
      onSave()
      onClose()
    } catch (err) {
      setError(err.message || 'حدث خطأ أثناء تعديل الموعد')
    } finally {
      setSaving(false)
    }
  }

  const slotChanged = date !== appointment.appointment_date || time !== appointment.appointment_time
  const canSubmit = !!(name.trim() && phone.trim() && time && (!slotChanged || (!slotTaken && !checking)))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg mx-4 p-8 max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-gray-800">تعديل الموعد</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X className="w-8 h-8" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="flex items-center gap-2 text-xl font-bold text-gray-700 mb-2">
              <User className="w-6 h-6" />
              اسم المريض
            </label>
            <input
              type="text" value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="أدخل اسم المريض"
              className="w-full text-xl p-4 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:outline-none transition"
              required
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-xl font-bold text-gray-700 mb-2">
              <Phone className="w-6 h-6" />
              رقم الهاتف
            </label>
            <input
              type="tel" value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="أدخل رقم الهاتف"
              className="w-full text-xl p-4 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:outline-none transition"
              required
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-xl font-bold text-gray-700 mb-2">
              <Calendar className="w-6 h-6" />
              تاريخ الموعد
            </label>
            <input
              type="date" value={date}
              onChange={(e) => setDate(e.target.value)}
              min={today}
              className="w-full text-xl p-4 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:outline-none transition"
              required
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-xl font-bold text-gray-700 mb-3">
              <Clock className="w-6 h-6" />
              اختر الساعة
            </label>
            <div className="grid grid-cols-3 gap-3">
              {TIME_SLOTS.map((slot) => (
                <button
                  key={slot.value} type="button"
                  onClick={() => setTime(slot.value)}
                  className={`text-xl font-bold py-4 px-2 rounded-2xl border-2 transition ${
                    time === slot.value
                      ? 'bg-blue-500 text-white border-blue-500 shadow-lg'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  {slot.label}
                </button>
              ))}
            </div>
            {slotTaken && slotChanged && (
              <p className="text-xl font-bold text-red-600 bg-red-50 border border-red-300 rounded-xl p-3 mt-2 text-center">
                عذراً، هذا الموعد محجوز بالفعل!
              </p>
            )}
            {checking && time && slotChanged && (
              <p className="text-base text-gray-400 mt-2">جاري التحقق من الموعد...</p>
            )}
          </div>

          {error && (
            <p className="text-lg font-bold text-red-600 bg-red-50 border border-red-300 rounded-xl p-3 text-center">
              {error}
            </p>
          )}

          <button
            type="submit" disabled={!canSubmit || saving}
            className={`w-full text-2xl font-bold py-5 rounded-2xl shadow-lg transition mt-4 ${
              canSubmit && !saving
                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
          </button>
        </form>
      </div>
    </div>
  )
}

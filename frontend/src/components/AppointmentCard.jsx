import { Clock, Phone, User, CheckCircle, XCircle, Edit3, Stethoscope, Frown } from 'lucide-react'

const STATUS_MAP = {
  confirmed: { label: 'مؤكد', bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500' },
  pending_approval: {
    label: 'في انتظار موافقة الطبيب',
    bg: 'bg-orange-100', text: 'text-orange-800', dot: 'bg-orange-500',
  },
  rejected: { label: 'مرفوض', bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-500' },
  attended: { label: 'تم الكشف', bg: 'bg-teal-100', text: 'text-teal-800', dot: 'bg-teal-500' },
  no_show: { label: 'لم يحضر', bg: 'bg-gray-100', text: 'text-gray-800', dot: 'bg-gray-500' },
}

function formatTimeArabic(time) {
  if (!time) return ''
  const [hh, mm] = time.split(':')
  const h = parseInt(hh, 10)
  if (h < 12) return `${h}:${mm} ص`
  if (h === 12) return `12:${mm} م`
  return `${h - 12}:${mm} م`
}

export default function AppointmentCard({
  appointment,
  showActions,
  showDoctorActions,
  onApprove,
  onReject,
  onAttend,
  onNoShow,
  onEdit,
}) {
  const s = STATUS_MAP[appointment.status] || STATUS_MAP.pending_approval

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 transition hover:shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-4 h-4 rounded-full ${s.dot}`} />
          <span className={`text-lg font-bold px-3 py-1 rounded-full ${s.bg} ${s.text}`}>
            {s.label}
          </span>
        </div>
        <div className="flex items-center gap-1 text-indigo-600 font-bold text-xl">
          <Clock className="w-6 h-6" />
          <span>{formatTimeArabic(appointment.appointment_time)}</span>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-2">
        <User className="w-6 h-6 text-gray-400" />
        <span className="text-2xl font-bold text-gray-800">{appointment.patient_name}</span>
      </div>
      <div className="flex items-center gap-3">
        <Phone className="w-5 h-5 text-gray-400" />
        <span className="text-xl text-gray-600" style={{ direction: 'ltr', textAlign: 'left' }}>
          {appointment.patient_phone}
        </span>
      </div>

      {/* Edit button for both views */}
      {onEdit && (
        <button
          onClick={() => onEdit(appointment)}
          className="mt-4 w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-lg font-bold py-3 rounded-xl transition"
        >
          <Edit3 className="w-5 h-5" />
          تعديل الموعد
        </button>
      )}

      {/* Approve / Reject — for pending appointments (doctor view) */}
      {showActions && appointment.status === 'pending_approval' && (
        <div className="mt-4 flex gap-4">
          <button
            onClick={() => onApprove(appointment.id)}
            className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white text-xl font-bold py-4 rounded-xl transition"
          >
            <CheckCircle className="w-6 h-6" />
            موافقة
          </button>
          <button
            onClick={() => onReject(appointment.id)}
            className="flex-1 flex items-center justify-center gap-2 bg-red-400 hover:bg-red-500 text-white text-xl font-bold py-4 rounded-xl transition"
          >
            <XCircle className="w-6 h-6" />
            رفض
          </button>
        </div>
      )}

      {/* Attend / No-show — for confirmed appointments (doctor view) */}
      {showDoctorActions && appointment.status === 'confirmed' && (
        <div className="mt-4 flex gap-4">
          <button
            onClick={() => onAttend(appointment.id)}
            className="flex-1 flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-600 text-white text-xl font-bold py-4 rounded-xl transition"
          >
            <Stethoscope className="w-6 h-6" />
            تم الكشف
          </button>
          <button
            onClick={() => onNoShow(appointment.id)}
            className="flex-1 flex items-center justify-center gap-2 bg-gray-400 hover:bg-gray-500 text-white text-xl font-bold py-4 rounded-xl transition"
          >
            <Frown className="w-6 h-6" />
            لم يحضر
          </button>
        </div>
      )}
    </div>
  )
}

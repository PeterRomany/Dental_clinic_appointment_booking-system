import datetime
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import engine, get_db, Base
from models import Patient, Appointment, User
from schemas import (
    AppointmentCreate,
    AppointmentUpdate,
    AppointmentResponse,
    AppointmentStatusUpdate,
    TokenResponse,
)
from auth import (
    verify_password,
    create_access_token,
    get_current_user,
    seed_default_users,
    hash_password,
)

Base.metadata.create_all(bind=engine)
seed_default_users()

app = FastAPI(title="عيادة الأسنان - نظام إدارة المواعيد")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DAILY_LIMIT = 6


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _appointment_response(a: Appointment) -> AppointmentResponse:
    return AppointmentResponse(
        id=a.id,
        patient_id=a.patient_id,
        patient_name=a.patient.name,
        patient_phone=a.patient.phone,
        appointment_date=a.appointment_date,
        appointment_time=a.appointment_time,
        status=a.status,
        created_at=a.created_at,
    )


def _validate_date_not_past(d: datetime.date):
    if d < datetime.date.today():
        raise HTTPException(400, "لا يمكن حجز موعد في تاريخ مضى.")


def _is_slot_taken(db: Session, app_date: datetime.date, app_time: str, exclude_id: int | None = None) -> bool:
    q = db.query(Appointment).filter(
        Appointment.appointment_date == app_date,
        Appointment.appointment_time == app_time,
    )
    if exclude_id:
        q = q.filter(Appointment.id != exclude_id)
    return q.first() is not None


def _confirmed_count_for_date(db: Session, app_date: datetime.date) -> int:
    return (
        db.query(func.count(Appointment.id))
        .filter(
            Appointment.appointment_date == app_date,
            Appointment.status == "confirmed",
        )
        .scalar()
        or 0
    )


# ================================  API Routes  ==============================


@app.get("/api/health")
def health():
    return {"status": "ok"}


# ---------------------------------------------------------------------------
# POST /api/login
# ---------------------------------------------------------------------------
@app.post("/api/login", response_model=TokenResponse)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(401, "اسم المستخدم أو كلمة المرور غير صحيحة.")

    token = create_access_token({"sub": user.username, "role": user.role})
    return TokenResponse(access_token=token, role=user.role)


# ---------------------------------------------------------------------------
# POST /api/setup-users  –  Re-seed default users (idempotent)
# ---------------------------------------------------------------------------
@app.post("/api/setup-users")
def setup_users(
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    created = []
    if not db.query(User).filter(User.username == "doctor").first():
        db.add(User(username="doctor", hashed_password=hash_password("adminpassword"), role="doctor"))
        created.append("doctor")
    if not db.query(User).filter(User.username == "assistant").first():
        db.add(User(username="assistant", hashed_password=hash_password("assistantpassword"), role="assistant"))
        created.append("assistant")
    db.commit()
    return {"created": created, "message": "انتهى."}


# ---------------------------------------------------------------------------
# GET /api/appointments?date=YYYY-MM-DD&from=YYYY-MM-DD&to=YYYY-MM-DD
# ---------------------------------------------------------------------------
@app.get("/api/appointments", response_model=list[AppointmentResponse])
def get_appointments(
    date: str | None = Query(None),
    from_date: str | None = Query(None, alias="from"),
    to_date: str | None = Query(None, alias="to"),
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    query = db.query(Appointment).join(Patient)

    if date:
        try:
            parsed = datetime.date.fromisoformat(date)
            query = query.filter(Appointment.appointment_date == parsed)
        except ValueError:
            raise HTTPException(400, "Invalid date format. Use YYYY-MM-DD.")
    else:
        today = datetime.date.today()
        if from_date:
            try:
                f = datetime.date.fromisoformat(from_date)
                query = query.filter(Appointment.appointment_date >= f)
            except ValueError:
                raise HTTPException(400, "Invalid from_date format.")
        else:
            query = query.filter(Appointment.appointment_date >= today)

        if to_date:
            try:
                t = datetime.date.fromisoformat(to_date)
                query = query.filter(Appointment.appointment_date <= t)
            except ValueError:
                raise HTTPException(400, "Invalid to_date format.")

    query = query.order_by(Appointment.appointment_date.asc(), Appointment.appointment_time.asc())
    return [_appointment_response(a) for a in query.all()]


# ---------------------------------------------------------------------------
# GET /api/appointments/pending
# ---------------------------------------------------------------------------
@app.get("/api/appointments/pending", response_model=list[AppointmentResponse])
def get_pending_appointments(
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    appointments = (
        db.query(Appointment)
        .join(Patient)
        .filter(Appointment.status == "pending_approval")
        .order_by(Appointment.appointment_date.asc(), Appointment.appointment_time.asc())
        .all()
    )
    return [_appointment_response(a) for a in appointments]


# ---------------------------------------------------------------------------
# GET /api/appointments/check?date=...&time=...
# ---------------------------------------------------------------------------
@app.get("/api/appointments/check")
def check_slot(
    date: str,
    time: str,
    exclude: int | None = None,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    try:
        d = datetime.date.fromisoformat(date)
    except ValueError:
        raise HTTPException(400, "Invalid date format.")
    taken = _is_slot_taken(db, d, time, exclude_id=exclude)
    return {"available": not taken}


# ---------------------------------------------------------------------------
# POST /api/appointments
# ---------------------------------------------------------------------------
@app.post("/api/appointments", response_model=AppointmentResponse)
def create_appointment(
    body: AppointmentCreate,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    _validate_date_not_past(body.appointment_date)

    if _is_slot_taken(db, body.appointment_date, body.appointment_time):
        raise HTTPException(409, "هذا الموعد محجوز بالفعل.")

    patient = (
        db.query(Patient)
        .filter(Patient.name == body.patient_name, Patient.phone == body.patient_phone)
        .first()
    )
    if not patient:
        patient = Patient(name=body.patient_name, phone=body.patient_phone)
        db.add(patient)
        db.flush()

    confirmed_count = _confirmed_count_for_date(db, body.appointment_date)
    status = "confirmed" if confirmed_count < DAILY_LIMIT else "pending_approval"

    appointment = Appointment(
        patient_id=patient.id,
        appointment_date=body.appointment_date,
        appointment_time=body.appointment_time,
        status=status,
    )
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    return _appointment_response(appointment)


# ---------------------------------------------------------------------------
# PUT /api/appointments/{id}  –  Edit (reschedule / modify)
# ---------------------------------------------------------------------------
@app.put("/api/appointments/{appointment_id}", response_model=AppointmentResponse)
def update_appointment(
    appointment_id: int,
    body: AppointmentUpdate,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(404, "الموعد غير موجود.")

    _validate_date_not_past(body.appointment_date)

    slot_changed = (
        body.appointment_date != appointment.appointment_date
        or body.appointment_time != appointment.appointment_time
    )
    if slot_changed and _is_slot_taken(db, body.appointment_date, body.appointment_time, exclude_id=appointment_id):
        raise HTTPException(409, "هذا الموعد محجوز بالفعل.")

    patient = appointment.patient
    patient.name = body.patient_name
    patient.phone = body.patient_phone

    appointment.appointment_date = body.appointment_date
    appointment.appointment_time = body.appointment_time

    if slot_changed and appointment.status == "confirmed":
        confirmed_count = _confirmed_count_for_date(db, body.appointment_date)
        if confirmed_count >= DAILY_LIMIT:
            appointment.status = "pending_approval"

    db.commit()
    db.refresh(appointment)
    return _appointment_response(appointment)


# ---------------------------------------------------------------------------
# PUT /api/appointments/{id}/status  –  Approve / reject / attend / no-show
# ---------------------------------------------------------------------------
@app.put("/api/appointments/{appointment_id}/status", response_model=AppointmentResponse)
def update_appointment_status(
    appointment_id: int,
    body: AppointmentStatusUpdate,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(404, "الموعد غير موجود.")

    appointment.status = body.status
    db.commit()
    db.refresh(appointment)
    return _appointment_response(appointment)


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

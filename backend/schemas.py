from typing import Literal
from datetime import date, datetime
from pydantic import BaseModel

STATUS_VALUES = Literal[
    "pending_approval", "confirmed", "rejected", "attended", "no_show"
]


class AppointmentCreate(BaseModel):
    patient_name: str
    patient_phone: str
    appointment_date: date
    appointment_time: str


class AppointmentUpdate(BaseModel):
    patient_name: str
    patient_phone: str
    appointment_date: date
    appointment_time: str


class AppointmentStatusUpdate(BaseModel):
    status: STATUS_VALUES


class AppointmentResponse(BaseModel):
    id: int
    patient_id: int
    patient_name: str
    patient_phone: str
    appointment_date: date
    appointment_time: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

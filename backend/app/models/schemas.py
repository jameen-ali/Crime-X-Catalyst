"""
Pydantic models matching the TypeScript types from frontend/src/types/
"""

from __future__ import annotations
from typing import Optional, Literal, Any
from pydantic import BaseModel


class FIR(BaseModel):
    id: str
    firNumber: str
    crimeType: str
    description: str
    victimName: str
    victimAge: int
    victimGender: Literal["Male", "Female"]
    suspectName: str
    suspectAge: int
    officerName: str
    officerId: str
    district: str
    station: str
    status: Literal["Open", "Under Investigation", "Closed", "Pending"]
    dateReported: str
    dateOccurred: str
    location: str
    latitude: float
    longitude: float
    severity: Literal["Critical", "High", "Medium", "Low"]
    weaponUsed: Optional[str] = None
    evidenceCount: int = 0


class Person(BaseModel):
    id: str
    name: str
    age: int
    gender: Literal["Male", "Female"]
    dob: str
    address: str
    district: str
    phone: str
    aadhaarLast4: str
    role: Literal["Suspect", "Victim", "Witness", "Associate"]
    riskScore: int
    linkedFIRs: list[str]
    linkedPersons: list[str]
    notes: Optional[str] = None


class Vehicle(BaseModel):
    id: str
    registrationNumber: str
    type: Literal["Car", "Motorcycle"]
    make: str
    model: str
    color: str
    ownerId: str
    ownerName: str
    status: Literal["Clear", "Wanted", "Stolen", "Under Watch"]
    linkedFIRs: list[str]


class Evidence(BaseModel):
    id: str
    firId: str
    type: Literal["Image", "Video", "Audio", "Document", "Physical"]
    fileName: str
    fileSize: int
    mimeType: str
    uploadedBy: str
    uploadedAt: str
    description: str
    tags: list[str]


class Alert(BaseModel):
    id: str
    type: str
    severity: Literal["Critical", "High", "Medium", "Low"]
    title: str
    description: str
    district: str
    location: str
    timestamp: str
    isRead: bool = False


class Prediction(BaseModel):
    id: str
    type: Literal["Hotspot", "Repeat Offender", "Trend", "Patrol"]
    district: str
    location: str
    latitude: float
    longitude: float
    confidence: int
    riskScore: int
    description: str
    recommendation: str
    predictedDate: str
    crimeType: str


class NetworkNode(BaseModel):
    id: str
    label: str
    type: Literal["Person", "Vehicle", "Case", "Organization", "Location", "Phone", "Weapon"]
    riskScore: Optional[int] = None
    data: dict[str, Any] = {}


class NetworkEdge(BaseModel):
    id: str
    source: str
    target: str
    type: str
    label: str


class KPIData(BaseModel):
    totalFIRs: int
    openCases: int
    solvedCases: int
    todayCrimes: int
    todayArrests: int
    activeInvestigations: int
    repeatOffenders: int
    crimeRiskScore: int


class Officer(BaseModel):
    id: str
    name: str
    rank: str
    badgeNumber: str
    district: str
    station: str
    role: Literal["Admin", "Analyst", "Officer"]
    email: str
    phone: str
    assignedCases: int
    closedCases: int
    joinedDate: str
    status: Literal["Active", "On Leave"]


class AuditLog(BaseModel):
    id: str
    action: str
    performedBy: str
    targetUser: Optional[str] = None
    timestamp: str
    details: str
    ipAddress: str

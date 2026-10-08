export type Patient = {
  id: string
  name: string
  dateOfBirth: string
  appointmentCode: string
  appointmentDate: string
  appointmentTime: string
  department: string
  clinician: string
  location: string
  floor: string
  waitingArea: string
}

export const patients: Patient[] = [
  {
    id: 'PC-10482', name: 'Jordan Lee', dateOfBirth: '1988-04-17', appointmentCode: '381624',
    appointmentDate: '2026-10-08', appointmentTime: '9:40 AM', department: 'Cardiology',
    clinician: 'Dr. Maya Patel', location: 'North Pavilion', floor: '2nd floor', waitingArea: 'Blue waiting room',
  },
  {
    id: 'PC-20937', name: 'Avery Morgan', dateOfBirth: '1975-11-02', appointmentCode: '725903',
    appointmentDate: '2026-10-08', appointmentTime: '10:15 AM', department: 'Imaging',
    clinician: 'Dr. Samuel Chen', location: 'East Pavilion', floor: '1st floor', waitingArea: 'Garden waiting area',
  },
]

export type ResearchEntry = {
  participantId: string
  mode: 'standard' | 'accessible'
  completionSeconds: number
  navigationErrors: number
  assistanceRequests: number
  completed: boolean
  recordedAt: string
}

export const RESEARCH_STORAGE_KEY = 'patientconnect.research.v1'

export function readResearchEntries(): ResearchEntry[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(RESEARCH_STORAGE_KEY) ?? '[]')
    return Array.isArray(value) ? (value as ResearchEntry[]) : []
  } catch {
    return []
  }
}
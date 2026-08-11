import { clearRole, clearToken, getToken, setRole, setToken, type Role } from "@/lib/storage"

const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000"

export type Grade = 3 | 4 | 5

export interface Batch {
  _id: string
  name: string
  year: number
  grades: Grade[]
  createdAt: string
}

export interface Student {
  _id: string
  name: string
  guardianName: string
  guardianPhone: string
  grade: Grade
  dateOfBirth: string
  photoUrl?: string
  qrCode: string
  batchId?: Batch | string | null
  isActive: boolean
  createdAt: string
}

export interface ClassSession {
  _id: string
  batchId: Batch | string
  grade: Grade
  date: string
  time?: string
  subject?: string
}

export interface AttendanceRecord {
  _id: string
  studentId: string
  classId: ClassSession | string
  present: boolean
  date: string
}

export interface MarksRecord {
  _id: string
  studentId: string | { _id: string; name: string; qrCode: string }
  subject: string
  examName?: string
  examDate: string
  marks: number
  maxMarks: number
  grade: Grade
}

export interface DashboardStats {
  totalStudents: number
  todayAttendance: string
  hasClassesToday: boolean
  presentToday: number
  expectedToday: number
  absentToday: number
  lowAttendanceCount: number
  publishedPosts: number
  pendingMembers: number | null
  recentMarks: number
}

export type MemberStatus = "pending" | "approved" | "rejected"

export interface Member {
  _id: string
  fullName: string
  phone: string
  email?: string
  dateOfBirth?: string
  address?: string
  guardianName?: string
  guardianPhone?: string
  interest?: string
  message?: string
  status: MemberStatus
  reviewNotes?: string
  reviewedBy?: { email: string } | null
  reviewedAt?: string
  createdAt: string
}

export interface RosterEntry {
  student: Student
  isPresent: boolean
  isRecorded: boolean
  attendanceId: string | null
}

export interface TodayRosterEntry {
  student: Student
  isPresent: boolean
  isRecorded: boolean
}

export interface TodaySession {
  classSession: ClassSession
  roster: TodayRosterEntry[]
}

export interface SubjectAverage {
  subject: string
  average: number
  count: number
}

export interface StudentDetail {
  student: Student
  attendance: AttendanceRecord[]
  marks: MarksRecord[]
  analytics: {
    attendancePercentage: number
    classesPresent: number
    totalClasses: number
    averageMarks: number
    subjectAverages: SubjectAverage[]
  }
}

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getToken()
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  })

  let data: unknown
  try {
    data = await res.json()
  } catch {
    data = {}
  }

  if (!res.ok) {
    const message =
      (data as { error?: string }).error ?? `Request failed (${res.status})`
    if (res.status === 401) {
      await clearToken()
      await clearRole()
    }
    throw new ApiError(message, res.status)
  }
  return data as T
}

export const api = {
  async login(email: string, password: string): Promise<void> {
    const data = await request<{
      success: boolean
      token?: string
      user?: { email: string; role: Role }
    }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })
    if (!data.token) {
      throw new ApiError(
        "Server did not return a token — deploy the updated web app.",
        500
      )
    }
    await setToken(data.token)
    // Local only, for nav gating (hiding Club Members from an lms_manager) — the
    // API re-checks the real role from the token on every request regardless.
    if (data.user?.role) await setRole(data.user.role)
  },

  async logout(): Promise<void> {
    await clearToken()
    await clearRole()
  },

  dashboardStats: () => request<DashboardStats>("/api/dashboard/stats"),

  members: (status?: MemberStatus) =>
    request<{ members: Member[] }>(
      `/api/members${status ? `?status=${status}` : ""}`
    ),

  memberDetail: (id: string) => request<{ member: Member }>(`/api/members/${id}`),

  reviewMember: (id: string, data: { status: MemberStatus; reviewNotes?: string }) =>
    request<{ member: Member }>(`/api/members/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteMember: (id: string) =>
    request<{ success: boolean }>(`/api/members/${id}`, { method: "DELETE" }),

  students: (params?: { grade?: string; batchId?: string }) => {
    const qs = new URLSearchParams(
      Object.entries(params ?? {}).filter(([, v]) => v)
    ).toString()
    return request<{ students: Student[] }>(
      `/api/students${qs ? `?${qs}` : ""}`
    )
  },

  createStudent: (data: {
    name: string
    guardianName: string
    guardianPhone: string
    grade: number
    dateOfBirth: string
    batchId?: string
  }) =>
    request<{ student: Student }>("/api/students", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  studentDetail: (id: string) => request<StudentDetail>(`/api/students/${id}`),

  lookupStudent: (qrCode: string, classId?: string) =>
    request<{
      student: Student
      attendedCount: number
      recordedCount: number
      attendanceRate: number | null
      existingRecord?: AttendanceRecord | null
    }>(
      `/api/students/lookup?qrCode=${encodeURIComponent(qrCode)}${
        classId ? `&classId=${classId}` : ""
      }`
    ),

  attendanceToday: () =>
    request<{ sessions: TodaySession[] }>("/api/attendance/today"),

  batches: () => request<{ batches: Batch[] }>("/api/batches"),

  createBatch: (data: { name: string; year: number; grades: number[] }) =>
    request<{ batch: Batch }>("/api/batches", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  batchDetail: (id: string) =>
    request<{ batch: Batch; classes: ClassSession[] }>(`/api/batches/${id}`),

  classes: (batchId?: string) =>
    request<{ classes: ClassSession[] }>(
      `/api/classes${batchId ? `?batchId=${batchId}` : ""}`
    ),

  createClass: (data: {
    batchId: string
    grade: number
    date: string
    time?: string
    subject?: string
  }) =>
    request<{ class: ClassSession }>("/api/classes", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  classDetail: (id: string) =>
    request<{ classSession: ClassSession; roster: RosterEntry[] }>(
      `/api/classes/${id}`
    ),

  saveAttendance: (data: {
    studentId: string
    classId: string
    present: boolean
  }) =>
    request<{
      success: boolean
      attendance: AttendanceRecord
      attendedCount: number
      recordedCount: number
    }>("/api/attendance", { method: "POST", body: JSON.stringify(data) }),

  marks: (grade?: string) =>
    request<{ marks: MarksRecord[] }>(
      `/api/marks${grade ? `?grade=${grade}` : ""}`
    ),

  saveMarks: (
    data: Array<{
      studentId: string
      subject: string
      examDate: string
      marks: number
      maxMarks: number
      grade: number
    }>
  ) =>
    request<{ success: boolean; count: number }>("/api/marks", {
      method: "POST",
      body: JSON.stringify(data),
    }),
}

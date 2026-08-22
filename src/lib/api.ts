import { clearRole, clearToken, getToken, setRole, setToken, type Role } from "@/lib/storage"

const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000"

export type Grade = 3 | 4 | 5

export interface Batch {
  _id: string
  name: string
  year: number
  grades: Grade[]
  autoPromote?: boolean
  createdAt: string
}

export interface Student {
  _id: string
  name: string
  school?: string
  address?: string
  guardianName: string
  guardianPhone: string
  grade: Grade
  photoUrl?: string
  qrCode: string
  batchId?: Batch | string | null
  isActive: boolean
  createdAt: string
  registrationNumber?: string
  registrationDate?: string
  totalLeaves?: number
  currentLeaveCycle?: number
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
  isAbsent?: boolean
  maxMarks: number
  grade: Grade
  // Not set on records saved before this field existed — a grade can have more
  // than one active batch at once (e.g. a new intake starting while an older
  // one is still running), so grade alone doesn't uniquely scope an exam roster.
  batchId?: Batch | string | null
}

export interface Exam {
  _id: string
  subject: string
  grade: Grade
  batchId: Batch | string
  examDate: string
  maxMarks: number
  name?: string
  resultsCount: number
  averagePercent: number | null
}

export interface ExamRosterEntry {
  student: Student
  mark: MarksRecord | null
  isRecorded: boolean
}

export interface AnalysisResult {
  studentId: string
  name: string
  grade: Grade
  examCount: number
  avgMarksPercent: number | null
  attendancePercent: number | null
  combinedScore: number | null
  partial: boolean
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
  studentsOnLeaveToday: number
  studentsAtCycle2: number
  studentsAtCycle3: number
  deactivatedStudents: number
}

export type NotificationType = "parent_warning" | "admin_critical"
export type NotificationStatus = "pending" | "acknowledged" | "resolved"

export interface AttendanceNotification {
  _id: string
  studentId: string
  registrationNumber?: string
  studentName: string
  type: NotificationType
  cycleGeneration: number
  leaveCount: number
  leaveDates: string[]
  status: NotificationStatus
  createdAt: string
}

export interface LeaveRecord {
  _id: string
  studentId: string
  classId: ClassSession | string
  date: string
  leaveCycleAtRecord?: number
  remarks?: string
}

export type MemberStatus = "pending" | "approved" | "rejected"

export interface Member {
  _id: string
  fullName: string
  phone: string
  whatsapp?: string
  email?: string
  dateOfBirth?: string
  age?: number
  gender?: string
  dateOfJoining?: string
  previousClub?: string
  address?: string
  nic?: string
  photoUrl?: string
  memberType?: string
  memberCode?: string
  guardianName?: string
  guardianPhone?: string
  interest?: string
  message?: string
  job?: string
  jobCategory?: string
  annualFee?: number
  paymentSlipUrl?: string
  validFrom?: string
  validUntil?: string
  renewalStatus?: "none" | "pending"
  renewalJob?: string
  renewalJobCategory?: string
  renewalAnnualFee?: number
  renewalPaymentSlipUrl?: string
  renewalSubmittedAt?: string
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

  decideRenewal: (id: string, action: "approve" | "reject") =>
    request<{ member: Member }>(`/api/members/${id}/renewal`, {
      method: action === "approve" ? "POST" : "DELETE",
    }),

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
    school?: string
    address?: string
    guardianName: string
    guardianPhone: string
    grade: number
    batchId?: string
  }) =>
    request<{ student: Student }>("/api/students", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  studentDetail: (id: string) => request<StudentDetail>(`/api/students/${id}`),

  updateStudent: (
    id: string,
    data: Partial<{
      name: string
      school: string
      address: string
      guardianName: string
      guardianPhone: string
      grade: number
      batchId: string
      isActive: boolean
    }>
  ) =>
    request<{ student: Student }>(`/api/students/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteStudent: (id: string, force = false) =>
    request<{ success: boolean }>(`/api/students/${id}${force ? "?force=true" : ""}`, { method: "DELETE" }),

  leaveHistory: (id: string) =>
    request<{ leaves: LeaveRecord[] }>(`/api/students/${id}/leave-history`),

  notifications: (status?: NotificationStatus) =>
    request<{ notifications: AttendanceNotification[] }>(
      `/api/notifications${status ? `?status=${status}` : ""}`
    ),

  updateNotification: (id: string, status: NotificationStatus) =>
    request<{ notification: AttendanceNotification }>(`/api/notifications/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

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

  createBatch: (data: { name: string; year: number; grades: number[]; autoPromote?: boolean }) =>
    request<{ batch: Batch }>("/api/batches", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  batchDetail: (id: string) =>
    request<{ batch: Batch; classes: ClassSession[] }>(`/api/batches/${id}`),

  updateBatch: (id: string, data: { name?: string; year?: number; grades?: number[]; autoPromote?: boolean }) =>
    request<{ batch: Batch }>(`/api/batches/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteBatch: (id: string) =>
    request<{ success: boolean }>(`/api/batches/${id}`, { method: "DELETE" }),

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

  updateClass: (
    id: string,
    data: { batchId?: string; grade?: number; date?: string; time?: string; subject?: string }
  ) =>
    request<{ classSession: ClassSession }>(`/api/classes/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteClass: (id: string) =>
    request<{ success: boolean }>(`/api/classes/${id}`, { method: "DELETE" }),

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

  marks: (params?: { grade?: string; batchId?: string }) => {
    const qs = new URLSearchParams(
      Object.entries(params ?? {}).filter(([, v]) => v)
    ).toString()
    return request<{ marks: MarksRecord[] }>(`/api/marks${qs ? `?${qs}` : ""}`)
  },

  saveMarks: (
    data: Array<{
      studentId: string
      subject: string
      examDate: string
      marks: number
      maxMarks: number
      grade: number
      batchId?: string
    }>
  ) =>
    request<{ success: boolean; count: number }>("/api/marks", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  exams: (params?: { grade?: string; batchId?: string; subject?: string }) => {
    const qs = new URLSearchParams(
      Object.entries(params ?? {}).filter(([, v]) => v)
    ).toString()
    return request<{ exams: Exam[] }>(`/api/exams${qs ? `?${qs}` : ""}`)
  },

  createExam: (data: {
    subject: string
    grade: number
    batchId: string
    examDate: string
    maxMarks: number
    name?: string
  }) =>
    request<{ exam: Exam }>("/api/exams", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  examDetail: (id: string) =>
    request<{ exam: Exam; roster: ExamRosterEntry[] }>(`/api/exams/${id}`),

  updateExam: (
    id: string,
    data: Partial<{ subject: string; grade: number; batchId: string; examDate: string; maxMarks: number; name: string }>
  ) =>
    request<{ exam: Exam }>(`/api/exams/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteExam: (id: string) =>
    request<{ success: boolean }>(`/api/exams/${id}`, { method: "DELETE" }),

  saveExamMarks: (examId: string, data: { studentId: string; marks?: number; isAbsent?: boolean }) =>
    request<{ success: boolean; count: number }>(`/api/exams/${examId}/marks`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  analysis: (params: { start: string; end: string; grade?: string; batchId?: string }) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v) as [string, string][]
    ).toString()
    return request<{ students: AnalysisResult[]; range: { start: string; end: string } }>(
      `/api/analysis?${qs}`
    )
  },
}

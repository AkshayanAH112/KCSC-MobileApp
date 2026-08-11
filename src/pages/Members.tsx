import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { SearchIcon } from "lucide-react"

import { api, type Member, type MemberStatus } from "@/lib/api"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"

const FILTERS: { value: MemberStatus | ""; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "", label: "All" },
]

const STATUS_VARIANT: Record<MemberStatus, "secondary" | "outline" | "destructive"> = {
  pending: "outline",
  approved: "secondary",
  rejected: "destructive",
}

export default function MembersPage() {
  const navigate = useNavigate()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<MemberStatus | "">("pending")

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const d = await api.members(filter || undefined)
      setMembers(d.members)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const filtered = members.filter((m) =>
    m.fullName.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <PageHeader
        title="Club Members"
        description="Applications from the club website, reviewed here."
      />

      <div className="relative">
        <SearchIcon className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search members…"
          className="pl-8"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === f.value
                ? "bg-primary text-primary-foreground"
                : "border bg-card text-muted-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="py-12">
          <CardContent className="text-center text-sm text-muted-foreground">
            No {filter || ""} members to show.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((m) => (
            <Card
              key={m._id}
              className="cursor-pointer py-4 transition-colors active:bg-muted/50"
              onClick={() => navigate(`/members/${m._id}`)}
            >
              <CardContent className="px-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 truncate font-semibold">{m.fullName}</p>
                  <Badge variant={STATUS_VARIANT[m.status]} className="capitalize shrink-0">
                    {m.status}
                  </Badge>
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {m.phone}
                  {m.interest ? ` · ${m.interest}` : ""}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Applied {new Date(m.createdAt).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

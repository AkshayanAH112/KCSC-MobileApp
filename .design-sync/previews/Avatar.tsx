import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
} from "lakshan-mobile"

export function Sizes() {
  return (
    <div className="flex items-center gap-3">
      <Avatar size="sm">
        <AvatarFallback>KS</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>NP</AvatarFallback>
      </Avatar>
      <Avatar size="lg">
        <AvatarFallback>TD</AvatarFallback>
      </Avatar>
    </div>
  )
}

export function WithBadge() {
  return (
    <div className="flex items-center gap-3">
      <Avatar size="lg">
        <AvatarFallback>KS</AvatarFallback>
        <AvatarBadge className="bg-green-500" />
      </Avatar>
      <Avatar size="lg">
        <AvatarFallback>NP</AvatarFallback>
        <AvatarBadge className="bg-destructive" />
      </Avatar>
    </div>
  )
}

export function Group() {
  return (
    <AvatarGroup>
      <Avatar>
        <AvatarFallback>KS</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>NP</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>TD</AvatarFallback>
      </Avatar>
      <AvatarGroupCount>+39</AvatarGroupCount>
    </AvatarGroup>
  )
}

export function StudentRow() {
  return (
    <div className="flex w-full max-w-xs items-center gap-3 rounded-xl border p-3">
      <Avatar size="lg">
        <AvatarFallback>KS</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">Kavindi Silva</p>
        <p className="truncate text-xs text-muted-foreground">
          Grade 4 · Morning Batch
        </p>
      </div>
    </div>
  )
}

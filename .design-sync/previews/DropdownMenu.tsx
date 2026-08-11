import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "lakshan-mobile"
import {
  MoreVerticalIcon,
  PencilIcon,
  QrCodeIcon,
  TrashIcon,
} from "lucide-react"

export function StudentActions() {
  return (
    <DropdownMenu open>
      <DropdownMenuTrigger
        render={<Button variant="outline" size="icon" aria-label="Actions" />}
      >
        <MoreVerticalIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Kavindi Silva</DropdownMenuLabel>
          <DropdownMenuItem>
            <PencilIcon />
            Edit details
          </DropdownMenuItem>
          <DropdownMenuItem>
            <QrCodeIcon />
            Show QR ID
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">
            <TrashIcon />
            Deactivate
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

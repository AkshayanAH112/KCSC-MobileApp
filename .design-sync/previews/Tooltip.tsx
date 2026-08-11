import {
  Button,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "lakshan-mobile"
import { QrCodeIcon } from "lucide-react"

export function OpenTooltip() {
  return (
    <TooltipProvider>
      <div className="flex items-center justify-center p-10">
        <Tooltip open>
          <TooltipTrigger
            render={<Button variant="outline" size="icon" aria-label="Scan" />}
          >
            <QrCodeIcon />
          </TooltipTrigger>
          <TooltipContent>Scan student QR ID</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}

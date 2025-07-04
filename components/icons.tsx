"use client"

import type { SVGProps } from "react"
import { Loader2 } from "lucide-react"

export const Icons = {
  spinner: (props: SVGProps<SVGSVGElement>) => (
    <Loader2 {...props} className={`animate-spin ${props.className ?? ""}`} />
  ),
}

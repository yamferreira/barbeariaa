import { ReactNode } from "react"
import { requireBarbeiro } from "@/app/_lib/auth"

const AdminLayout = async ({ children }: { children: ReactNode }) => {
  await requireBarbeiro()

  return <>{children}</>
}

export default AdminLayout

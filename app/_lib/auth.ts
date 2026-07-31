import { redirect } from "next/navigation"
import { auth } from "@/app/_lib/auth-config"

export const requireBarbeiro = async () => {
  const session = await auth()

  if (!session?.user) {
    redirect("/")
  }

  if (session.user.role !== "BARBEIRO") {
    redirect("/")
  }

  return session
}

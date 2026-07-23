"use client"

import { usePathname, useRouter } from "next/navigation"
import { Input } from "./input"

interface DateFilterProps {
  defaultValue: string
}

const DateFilter = ({ defaultValue }: DateFilterProps) => {
  const router = useRouter()
  const pathname = usePathname()

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    if (!value) return
    router.push(`${pathname}?data=${value}`)
  }

  return (
    <Input
      type="date"
      defaultValue={defaultValue}
      onChange={handleChange}
      className="w-fit"
    />
  )
}

export default DateFilter

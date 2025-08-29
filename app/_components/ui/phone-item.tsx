"use client"

import { SmartphoneIcon } from "lucide-react"
import { Button } from "./button"

interface PhoneItemProps {
  phone: string
}

const PhoneItem = ({ phone }: PhoneItemProps) => {
  const handleCopyPhoneClick = (phone: string) => {
    navigator.clipboard.writeText(phone)
  }
  return (
    <div className="flex justify-between" key={phone}>
      <div className="flex items-center gap-2">
        <SmartphoneIcon className="text-primary" size={18} />
        <p className="text-sm">{phone}</p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleCopyPhoneClick(phone)}
      >
        Copiar
      </Button>
    </div>
  )
}

export default PhoneItem

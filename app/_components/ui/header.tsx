import Image from "next/image"
import { Card, CardContent } from "./card"
import { Button } from "./button"
import { MenuIcon } from "lucide-react"

const Header = () => {
  return (
    <Card>
      <CardContent className="flex flex-row items-center justify-between p-5">
        <Image src="/logo.png" height={18} width={120} alt="Logo" />
        <Button size="icon" variant="outline">
          <MenuIcon />
        </Button>
      </CardContent>
    </Card>
  )
}

export default Header

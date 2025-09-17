import Image from "next/image"
import { Card, CardContent } from "./card"
import { Button } from "./button"
import { MenuIcon } from "lucide-react"
import { Sheet, SheetTrigger } from "./sheet"
import SideBarSheet from "./sidebar-sheet"
import Link from "next/link"

const Header = () => {
  return (
    <Card>
      <CardContent className="flex flex-row items-center justify-between p-2">
        <Link href="/">
          <Image src="/logoluizdois.png" height={18} width={120} alt="Logo" />
        </Link>

        <Sheet>
          <SheetTrigger asChild>
            <Button size="icon" variant="outline">
              <MenuIcon />
            </Button>
          </SheetTrigger>
          <SideBarSheet />
        </Sheet>
      </CardContent>
    </Card>
  )
}

export default Header

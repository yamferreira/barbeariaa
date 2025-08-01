import { SearchIcon } from "lucide-react"
import Header from "./_components/ui/header"
import { Input } from "./_components/ui/input"
import { Button } from "./_components/ui/button"
import Image from "next/image"
import { Card, CardContent } from "./_components/ui/card"
import { Badge } from "./_components/ui/badge"
import { Avatar, AvatarImage } from "@radix-ui/react-avatar"

const Home = () => {
  return (
    <div>
      {/* header */}
      <Header />
      <div className="p-5">
          <h2 className="text-xl font-bold">Olá, Yam!</h2>
          <p>Segunda-feira, 05 de agosto.</p>

        {/* search input */}
        <div className="flex items-center gap-8 mt-6">
          <Input placeholder="Faça sua busca..." />
          <Button>
            <SearchIcon />
          </Button>
        </div>

        {/* banner image */}
        <div className="relative mt-6 h-[150px] w-full ">
          <Image src="/banner.png" fill className="rounded-xl object-cover" alt="Banner" />
        </div>

        <Card className="mt-6">
          <CardContent className="flex justify-between p-0">
            {/* div left */}
            <div className="flex flex-col gap-2 py-5 pl-5">
              <Badge className="w-fit" >Confirmado</Badge>
              <h3 className="font-semibold">Corte de Cabelo</h3>

              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src="https://utfs.io/f/45331760-899c-4b4b-910e-e00babb6ed81-16q.png"/>
                </Avatar>
                <p className="text-sm">Barbearia do Luiz</p>

              </div>
            </div>
            {/* div right */}
            <div className="flex flex-col items-center justify-center px-5 py-5 border-l">
              <p className="text-sm">Agosto</p>
              <p className="text-2xl">05</p>
              <p className="text-sm">10:00</p>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}

export default Home

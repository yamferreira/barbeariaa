import { Avatar, AvatarImage } from "./avatar"
import { Badge } from "./badge"
import { Card, CardContent } from "./card"

const BookingItem = () => {
  return (
    <>
      <h2 className="mt-6 mb-3 text-xs font-bold text-gray-400 uppercase">
        Agendamentos
      </h2>

      <Card>
        <CardContent className="flex justify-between p-0">
          {/* div left */}
          <div className="flex flex-col gap-2 py-5 pl-5">
            <Badge className="w-fit">Confirmado</Badge>
            <h3 className="font-semibold">Corte de Cabelo</h3>

            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src="https://utfs.io/f/45331760-899c-4b4b-910e-e00babb6ed81-16q.png" />
              </Avatar>
              <p className="text-sm">Barbearia do Luiz</p>
            </div>
          </div>
          {/* div right */}
          <div className="flex flex-col items-center justify-center border-l px-5 py-5">
            <p className="text-sm">Agosto</p>
            <p className="text-2xl">05</p>
            <p className="text-sm">10:00</p>
          </div>
        </CardContent>
      </Card>
    </>
  )
}

export default BookingItem

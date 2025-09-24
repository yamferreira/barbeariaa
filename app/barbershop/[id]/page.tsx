import { db } from "@/app/_lib/prisma"
import { ChevronLeftIcon, MapPinIcon, MenuIcon, StarIcon } from "lucide-react"
import Image from "next/image"
import { Button } from "@/app/_components/ui/button"
import Link from "next/link"
import { notFound } from "next/navigation"
import ServiceItem from "@/app/_components/ui/service-item"
import PhoneItem from "@/app/_components/ui/phone-item"
import { Sheet, SheetTrigger } from "@/app/_components/ui/sheet"
import SidebarSheet from "@/app/_components/ui/sidebar-sheet"

interface BarbershopPageProps {
  params: {
    id: string
  }
}

const BarbershopPage = async ({ params }: BarbershopPageProps) => {
  // chamar o meu banco de dados
  const barbershop = await db.barbershop.findUnique({
    where: {
      id: params.id,
    },

    include: {
      services: true,
    },
  })

  if (!barbershop) {
    return notFound()
  }

  const services = barbershop.services.map((service) => ({
    ...service,
    price: Number(service.price),
  }))

  return (
    <div>
      {/* IMAGEM */}
      <div className="relative h-[250px] w-full">
        <Image
          alt={barbershop.name}
          src={barbershop?.imageUrl}
          fill
          className="object-cover"
        />

        <Button
          size="icon"
          variant="secondary"
          className="absolute top-4 left-4"
          asChild
        >
          <Link href="/">
            <ChevronLeftIcon />
          </Link>
        </Button>

        <Sheet>
          <SheetTrigger asChild>
            <Button
              size="icon"
              variant="outline"
              className="absolute top-4 right-4"
            >
              <MenuIcon />
            </Button>
          </SheetTrigger>
          <SidebarSheet />
        </Sheet>
      </div>

      {/* TÍTULO */}
      <div className="border-b border-solid p-5">
        <h1 className="mb-3 text-xl font-bold">{barbershop.name}</h1>
        <div className="mb-2 flex items-center gap-2">
          <MapPinIcon className="text-primary" size={18} />
          <p className="text-sm">{barbershop?.address}</p>
        </div>

        <div className="flex items-center gap-2">
          <StarIcon className="fill-primary text-primary" size={18} />
          <p className="text-sm">5,0 (499 avaliações)</p>
        </div>
      </div>

      {/* DESCRIÇÃO */}
      <div className="space-y-2 border-b border-solid p-5">
        <h2 className="text-xs font-bold text-gray-400 uppercase">Sobre nós</h2>
        <p className="text-justify text-sm">{barbershop?.description}</p>
      </div>

      {/* Services */}
      <div className="space-y-3 border-b border-solid p-5">
        <h2 className="text-xs font-bold text-gray-400 uppercase">Serviços</h2>
        <div className="space-y-3">
          {services.map((service) => (
            <ServiceItem
              key={service.id}
              barbershop={{ name: barbershop.name }}
              service={service}
            />
          ))}
        </div>
      </div>

      {/* CONTATO */}
      <div className="space-y-3 p-5">
        {barbershop.phone.map((phone, idx) => (
          <PhoneItem key={phone + idx} phone={phone} />
        ))}
      </div>
    </div>
  )
}

export default BarbershopPage

"use client"

import Image from "next/image"
import { Button } from "./button"
import { CalendarIcon, HomeIcon, LogInIcon, LogOutIcon } from "lucide-react"
import { SheetContent, SheetHeader, SheetTitle, SheetClose } from "./sheet"
import Link from "next/link"
import { quickSearchOptions } from "@/app/_constants/search"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog"
import { signIn, signOut } from "next-auth/react"
import { Avatar, AvatarImage } from "./avatar"
import { useSession } from "next-auth/react"

const SideBarSheet = () => {
  const { data } = useSession()
  const handleLoginWithGoogle = () => signIn("google")
  const handleLogOutClick = () => signOut()

  return (
    <SheetContent className="overflow-y-auto">
      <SheetHeader>
        <SheetTitle className="text-left">Menu</SheetTitle>
      </SheetHeader>

      <div className="flex items-center justify-between gap-3 border-b border-solid py-5 pl-3">
        {data?.user ? (
          <div className="flex items-center gap-2">
            <Avatar>
              <AvatarImage
                src={data?.user?.image ?? ""}
                className="h-10 w-10 rounded-full object-cover"
              />
            </Avatar>

            <div>
              <p className="font-bold">{data?.user?.name}</p>
              <p className="text-xs">{data?.user?.email}</p>
            </div>
          </div>
        ) : (
          <>
            <h2 className="font-bold">Olá, faça seu Login!</h2>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="icon" variant="secondary">
                  <LogInIcon />
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[90%]">
                <DialogHeader>
                  <DialogTitle>Faça seu login na plataforma</DialogTitle>
                  <DialogDescription>
                    Conecte usando sua conta do Google.
                  </DialogDescription>
                </DialogHeader>
                <Button
                  variant="outline"
                  className="mt-2 justify-center gap-1 font-bold"
                  onClick={handleLoginWithGoogle}
                >
                  <Image
                    src="/google.svg"
                    width={18}
                    height={18}
                    alt="Google Icon"
                  />
                  Google
                </Button>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>

      <div className="flex flex-col gap-2 border-b border-solid p-5 py-5">
        <SheetClose asChild>
          <Button className="justify-start gap-2" variant="ghost" asChild>
            <Link href="/">
              <HomeIcon size={18} />
              Início
            </Link>
          </Button>
        </SheetClose>

        <SheetClose asChild>
          <Button className="justify-start gap-2" variant="ghost" asChild>
            <Link href="/bookings">
              <CalendarIcon size={18} />
              Agendamentos
            </Link>
          </Button>
        </SheetClose>
      </div>

      <div className="flex flex-col gap-2 border-b border-solid p-5 py-5">
        {quickSearchOptions.map((option) => (
          <SheetClose asChild key={option.title}>
            <Button className="justify-start gap-2" variant="ghost" asChild>
              <Link href={`/barbershop?services=${option.title}`}>
                <Image
                  src={option.imageUrl}
                  width={18}
                  height={18}
                  alt={option.title}
                />
                {option.title}
              </Link>
            </Button>
          </SheetClose>
        ))}
      </div>

      <div className="flex flex-col gap-2 p-5 py-5">
        <Button
          variant="ghost"
          className="justify-start gap-2"
          onClick={handleLogOutClick}
        >
          <LogOutIcon size={18} />
          Sair da Conta
        </Button>
      </div>
    </SheetContent>
  )
}

export default SideBarSheet

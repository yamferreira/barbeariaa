import { PrismaClient } from "../app/generated/prisma"
console.log("Seed rodando")
const prisma = new PrismaClient()

const LUIZBARBER = {
  name: "LuizBarber",
  address:
    "R. Virgílio Martins de Oliveira, 438 - Centro, Francisco Morato - SP, 07901-020",
  phone: ["11913346096"],
  description: "Cortes de cabelo e barba com hora marcada.",
  imageUrl: "/logoluizdois.png",
}

async function seedDatabase() {
  try {
    const existing = await prisma.barbershop.findFirst({
      where: { name: LUIZBARBER.name },
    })

    const barbershop = existing
      ? await prisma.barbershop.update({
          where: { id: existing.id },
          data: LUIZBARBER,
        })
      : await prisma.barbershop.create({ data: LUIZBARBER })

    console.log("LuizBarber:", barbershop)
  } catch (error) {
    console.error("Erro ao rodar o seed:", error)
  } finally {
    await prisma.$disconnect()
  }
}

seedDatabase()

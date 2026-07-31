import { db } from "@/app/_lib/prisma"
import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { Adapter } from "next-auth/adapters"
import type { PrismaClient } from "@prisma/client"

export const { handlers, signIn, signOut, auth } = NextAuth({
  // @auth/prisma-adapter types its param against @prisma/client's PrismaClient,
  // but this project generates the client to a custom output path
  // (app/generated/prisma), so it's a structurally different type at compile
  // time even though it's the same class at runtime.
  adapter: PrismaAdapter(db as unknown as PrismaClient) as Adapter,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      session.user = {
        ...session.user,
        id: user.id,
        role: user.role,
      }
      return session
    },
  },
})

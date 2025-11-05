"use server"

import { createServerClient } from "@/lib/supabase/server"
import { createUser } from "@/lib/db"
import { redirect } from "next/navigation"

export async function signUp(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const repeatPassword = formData.get("repeatPassword") as string

  if (password !== repeatPassword) {
    return { error: "Passwords do not match" }
  }

  const supabase = await createServerClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo:
        process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
        `${process.env.VERCEL_URL || "http://localhost:3000"}/generate`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  if (data.user) {
    try {
      await createUser(data.user.id, email)
    } catch (err) {
      console.error("[v0] Failed to create user in Neon:", err)
      // Continue anyway - the user is created in Supabase
    }
  }

  redirect("/auth/sign-up-success")
}

export async function signIn(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  const supabase = await createServerClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  redirect("/generate")
}

import { createContext, ReactNode, useEffect, useState } from "react"
import Router from "next/router"
import { api } from "../services/api"

import { destroyCookie, parseCookies, setCookie } from "nookies"

type User = {
  email: string
  permissions: string[]
  roles: string[]
}

type SignInCredentials = {
  email: string
  password: string
}

type AuthContextData = {
  signIn(credentials: SignInCredentials): Promise<void>
  isAuthenticated: boolean
  user: User
}

type AuthContextProviderProps = {
  children: ReactNode
}

const AuthContext = createContext({} as AuthContextData)

function singOut() {
  destroyCookie(undefined, "nextauth.token")
  destroyCookie(undefined, "nextauth.refreshToken")

  Router.push("/")
}

const AuthContextProvider = ({ children }: AuthContextProviderProps) => {
  const [user, setUser] = useState<User>()
  const isAuthenticated = !!user

  useEffect(() => {
    const { "nextauth.token": token } = parseCookies()
    if (token) {
      api
        .get("/me")
        .then((response) => {
          const { email, permissions, roles } = response.data

          setUser({
            email,
            permissions,
            roles,
          })
        })
        .catch((err) => {
          singOut()
        })
    }
  }, [])

  async function signIn({ email, password }: SignInCredentials) {
    try {
      const response = await api.post("/sessions", {
        email,
        password,
      })

      const { token, refreshToken, roles, permissions } = response.data

      // sessionStorage  => não fica disponível em outra sessão
      // localStorage => dura mesmo que fechemos o navegador
      // cookies => acessível mesmo do lado do servidor

      setCookie(undefined, "nextauth.token", token, {
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/",
      })
      setCookie(undefined, "nextauth.refreshToken", refreshToken, {
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/",
      })

      setUser({
        email,
        roles,
        permissions,
      })

      api.defaults.headers["Authorization"] = `Bearer ${token}`

      Router.push("/dashboard")
    } catch (err) {
      console.log(err)
    }
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, signIn, user }}>
      {children}
    </AuthContext.Provider>
  )
}

export { AuthContextProvider, AuthContext, singOut }

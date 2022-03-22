import axios, { AxiosError } from "axios"
import { parseCookies, setCookie } from "nookies"
import { singOut } from "../contexts/AuthContext"
import { AuthTokenError } from "../errors/AuthTokenError"

let isRefreshing = false
let failedRequestQueue = []

function setupAPIClient(ctx = undefined) {
  let cookies = parseCookies(ctx)

  const api = axios.create({
    baseURL: "http://localhost:3333",
    headers: {
      Authorization: `Bearer ${cookies["nextauth.token"]}`,
    },
  })

  api.interceptors.response.use(
    (response) => {
      return response
    },
    (error: AxiosError) => {
      if (error.response.status === 401) {
        if (error.response.data?.code === "token.expired") {
          //renovar o token
          cookies = parseCookies(ctx)

          const { "nextauth.refreshToken": refreshToken } = cookies
          const originalConfig = error.config

          if (!isRefreshing) {
            console.log("refreshing")
            isRefreshing = true
            api
              .post("/refresh", {
                refreshToken,
              })
              .then((response) => {
                const { token } = response.data

                setCookie(ctx, "nextauth.token", token, {
                  maxAge: 60 * 60 * 24 * 30,
                  path: "/",
                })

                setCookie(
                  ctx,
                  "nextauth.refreshToken",
                  response.data.refreshToken,
                  {
                    maxAge: 60 * 60 * 24 * 30,
                    path: "/",
                  }
                )

                api.defaults.headers["Authorization"] = `Bearer ${token}`

                failedRequestQueue.forEach((request) => request.resolve(token))
                failedRequestQueue = []
              })
              .catch((err) => {
                failedRequestQueue.forEach((request) => request.reject(err))
                failedRequestQueue = []
                if (typeof window !== "undefined") {
                  singOut()
                }
              })
              .finally(() => {
                isRefreshing = false
              })
          }
          return new Promise((resolve, reject) => {
            failedRequestQueue.push({
              resolve: (token: string) => {
                originalConfig.headers["Authorization"] = `Bearer ${token}`
                resolve(api(originalConfig))
              },
              reject: (err: AxiosError) => {
                reject(err)
              },
            })
          })
        } else {
          if (typeof window !== "undefined") {
            singOut()
          } else {
            return Promise.reject(new AuthTokenError())
          }
        }
      }

      return Promise.reject(error)
    }
  )

  return api
}

export { setupAPIClient }

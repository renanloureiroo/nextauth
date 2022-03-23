import { destroyCookie } from "nookies"
import { useContext, useEffect } from "react"
import { Can } from "../components/Can"
import { AuthContext } from "../contexts/AuthContext"
import { AuthTokenError } from "../errors/AuthTokenError"
import { useCan } from "../hooks/useCan"
import { setupAPIClient } from "../services/api"
import { api } from "../services/apiClient"
import { withSSRAuth } from "../utils/withSSRAuth"

const Dashboard = () => {
  const { user, singOut } = useContext(AuthContext)

  useEffect(() => {
    api
      .get("/me")
      .then((response) => console.log(response))
      .catch((err) => console.log(err))
  }, [])
  return (
    <>
      <h1>Dashboard: {user?.email} </h1>
      <Can permissions={["metrics.list"]}>
        <button onClick={singOut}>Sair</button>
        <div>Métricas</div>
      </Can>
    </>
  )
}

export const getServerSideProps = withSSRAuth(async (ctx) => {
  const apiClient = setupAPIClient(ctx)

  const response = await apiClient.get("/me")
  console.log(response.data)

  return {
    props: {},
  }
})

export default Dashboard

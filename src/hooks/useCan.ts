import { useContext } from "react"
import { AuthContext } from "../contexts/AuthContext"
import { validateUserPermission } from "../utils/validateUserPermissions"

type useCanParams = {
  permissions?: string[]
  roles?: string[]
}

const useCan = ({ permissions, roles }: useCanParams) => {
  const { user, isAuthenticated } = useContext(AuthContext)

  if (!isAuthenticated) {
    return false
  }

  const userHasValidPermissions = validateUserPermission({
    user,
    permissions,
    roles,
  })

  return userHasValidPermissions
}

export { useCan }

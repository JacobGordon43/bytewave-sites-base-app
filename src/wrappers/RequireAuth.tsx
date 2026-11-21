import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { getPortalHome, type AuthRole } from "../auth/roles";

interface RequireRoleProps {
    allowedRoles: readonly AuthRole[]
}

export default function RequireAuth({allowedRoles}: RequireRoleProps){
    const auth = useAuth();
    const isAuthenticated = auth.status === "authenticated"

    if(auth.status === "checking"){
        return null;
    }

    if(!isAuthenticated){
        return <Navigate to="/login" replace />;
    }

    const hasAccess = auth.groups.some((group) => allowedRoles.includes(group));

    if(!hasAccess){
        return <Navigate to={getPortalHome(auth.groups) ?? "/"} replace />;
    }

    return <Outlet />

}

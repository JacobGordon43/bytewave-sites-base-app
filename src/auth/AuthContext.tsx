import { fetchAuthSession } from "aws-amplify/auth";
import { Hub } from "aws-amplify/utils";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getAuthRoles, type AuthRole } from "./roles";

type AuthState = {
    status : "checking" | "authenticated" | "unauthenticated"
    sub?:string;
    email?:string
    groups:AuthRole[]
}

const unauthenticated: AuthState = {
    status: "unauthenticated",
    groups: []
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({children}: {children: ReactNode}){
    const [auth, setAuth] = useState<AuthState>({
        status: "checking",
        groups: []
    })

    useEffect(()=>{
        let active = true;

        const refreshAuth = async () => {
            try{
                const session = await fetchAuthSession();
                const payload = session.tokens?.idToken?.payload

                if(!payload){
                    if(active) setAuth(unauthenticated)
                    return;
                }

                if(active){
                    setAuth({
                        status: "authenticated",
                        sub: payload.sub,
                        email: typeof payload.email === "string" ? payload.email : undefined,
                        groups: getAuthRoles(payload["cognito:groups"])
                    })
                }
            }catch{
                if(active) setAuth(unauthenticated)
            }
        }
        void refreshAuth();

        const stopListening = Hub.listen("auth", ({payload}) => {
            switch(payload.event){
                case "signedIn":
                case "tokenRefresh":
                    void refreshAuth();
                    break;
                case "signedOut":
                case "tokenRefresh_failure":
                    setAuth(unauthenticated);
                    break;
            }
        })

        return () => {
            active = false;
            stopListening();
        }
    }, [])

    return (
        <AuthContext.Provider value={auth}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth(){
    const auth = useContext(AuthContext);
    
    if(!auth){
        throw new Error ("useAuth must be used inside AuthProvider")
    }

    return auth;
}

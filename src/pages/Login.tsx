import { siteConfig } from "../config/site";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import Header from "../components/Header";
import { confirmSignIn, fetchAuthSession, signIn, signOut } from "aws-amplify/auth";
import LoginForm from "../components/forms/LoginForm";
import UpdatePassword from "../components/forms/UpdatePassword";
import SEO from "../components/SEO";
import FeedbackMessage from "../components/FeedbackMessage";
import { getPortalHome } from "../auth/roles";
export default function Login() {
    const PASSWORD_CHANGE_KEY = "bytewave:password-change-required";
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showUpdatePassword, setShowUpdatePassword] = useState(() => sessionStorage.getItem(PASSWORD_CHANGE_KEY) === "true");
    const [passwordChanged, setPasswordChanged] = useState(false);
    const navigate = useNavigate();
    const passwordRef = useRef<null | HTMLFormElement>(null);
    const loginRef = useRef<null | HTMLFormElement>(null);
    useEffect(() => {
        let cancelled = false;
        const redirectIfSignedIn = async () => {
            try {
                const session = await fetchAuthSession();
                const idToken = session.tokens?.idToken?.payload;
                const groups = idToken?.["cognito:groups"] as string[] | undefined;
                const destination = getPortalHome(groups ?? []);
                if (!cancelled && destination)
                    navigate(destination, { replace: true });
            }
            catch {
            }
        };
        redirectIfSignedIn();
        return () => {
            cancelled = true;
        };
    }, [navigate]);
    const attemptSignIn = async (email: string, password: string) => {
        const response = await signIn({
            username: email,
            password
        });
        if (response.nextStep?.signInStep === "CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED") {
            sessionStorage.setItem(PASSWORD_CHANGE_KEY, "true");
            setError(null);
            setShowUpdatePassword(true);
        }
        else if (response.isSignedIn) {
            sessionStorage.removeItem(PASSWORD_CHANGE_KEY);
            setShowUpdatePassword(false);
            await handleNavigate();
            setIsLoading(false);
        }
        else {
            setIsLoading(false);
            throw new Error("Issue signing in");
        }
    };
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setPasswordChanged(false);
        if (loginRef.current) {
            const formData = new FormData(loginRef.current);
            const email = formData.get("email")?.toString();
            const password = formData.get("password")?.toString();
            if (!email || email === "" || !password || password === "") {
                setError("Missing credentials. Please fill out your email and password");
                return;
            }
            try {
                await attemptSignIn(email, password);
            }
            catch (err: any) {
                if (err.message?.includes("already a signed in user")) {
                    await signOut();
                    await attemptSignIn(email, password);
                }
                else if (err.message?.includes("does not exist")) {
                    setError("Incorrect username or password.");
                }
                else if (err instanceof Error) {
                    setError(err.message);
                }
                else {
                    setError("There was an unknown issue with the login. Please try again or contact support.");
                }
            }
            finally {
                setIsLoading(false);
            }
        }
    };
    const handleNavigate = async () => {
        const session = await fetchAuthSession();
        const idToken = session.tokens?.idToken?.payload;
        const groups = idToken?.["cognito:groups"] as string[] | undefined;
        const destination = getPortalHome(groups ?? []);
        if (destination) {
            navigate(destination, { replace: true });
            return;
        }
        setError("This account does not have access to the Bytewave Sites portal. Please contact Bytewave Sites for support.".replaceAll("Bytewave Sites", siteConfig.name));
        await signOut();
    };
    const comparePasswords = (newPassword: string, confirmPassword: string) => {
        if (!newPassword || !confirmPassword) {
            setError("Missing credentials. Please fill out both password fields.");
            return false;
        }
        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            return false;
        }
        return true;
    };
    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordRef.current) {
            const formData = new FormData(passwordRef.current);
            const newPassword = formData.get("updatedPassword")?.toString() || "";
            const confirmPassword = formData.get("confirmPassword")?.toString() || "";
            if (comparePasswords(newPassword, confirmPassword)) {
                try {
                    const response = await confirmSignIn({
                        challengeResponse: newPassword,
                    });
                    if (!response.isSignedIn) {
                        throw new Error(`Additional steps required: ${response.nextStep}`);
                    }
                    setError(null);
                    setShowUpdatePassword(false);
                    setPasswordChanged(true);
                    sessionStorage.removeItem(PASSWORD_CHANGE_KEY);
                    handleNavigate();
                }
                catch (err) {
                    if (err instanceof Error) {
                        setError(err.message);
                    }
                    else {
                        setError("An unknown error occurred.");
                    }
                }
                finally {
                    setIsLoading(false);
                }
            }
        }
    };
    const determineForm = () => {
        return showUpdatePassword ? (<UpdatePassword error={error} passwordRef={passwordRef} onSubmit={(e) => { handlePasswordUpdate(e); }} isLoading={isLoading}/>) : (<LoginForm error={error} loginRef={loginRef} onSubmit={(e) => { handleLogin(e); }} isLoading={isLoading}/>);
    };
    return (<>
        <SEO title={"Bytewave Sites | Login".replaceAll("Bytewave Sites", siteConfig.name)} description={"Sign in to your Bytewave Sites account.".replaceAll("Bytewave Sites", siteConfig.name)}/>

          <Header />
          <main className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md">
        <div>
          
          <div>
            <h1><Link to="/">{"Bytewave Sites".replaceAll("Bytewave Sites", siteConfig.name).replaceAll("billing@bytewavesites.com", siteConfig.billingEmail)}</Link></h1>
            <p>Client Portal Login</p>
          </div>

          
          {error && (<FeedbackMessage type="error" message={error} onClose={() => setError(null)}/>)}
          
          {passwordChanged && (<FeedbackMessage type="success" message="Your password was successfully updated." onClose={() => setPasswordChanged(false)}/>)}

          {determineForm()}
          
          <div>
            <p>
              Need an account? <Link to="/contact">Contact support</Link>
            </p>
          </div>
        </div>
      </div>
    </main>
        </>);
}

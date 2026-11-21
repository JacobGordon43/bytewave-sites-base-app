import { siteConfig } from "../config/site";
import { Link } from "react-router-dom";
import { confirmSignIn } from "@aws-amplify/auth";
import React, { useRef, useState } from "react";
import Header from "../components/Header";
import FeedbackMessage from "../components/FeedbackMessage";
import PasswordInput from "../components/PasswordInput";
export default function UpdatePassword() {
    const [error, setError] = useState<null | string>(null);
    const formRef = useRef<HTMLFormElement | null>(null);
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
        if (formRef.current) {
            const formData = new FormData(formRef.current);
            const newPassword = formData.get("updatedPassword")?.toString() || "";
            const confirmPassword = formData.get("confirmPassword")?.toString() || "";
            if (comparePasswords(newPassword, confirmPassword)) {
                try {
                    await confirmSignIn({
                        challengeResponse: newPassword,
                    });
                    setError(null);
                }
                catch (err) {
                    if (err instanceof Error) {
                        setError(err.message);
                    }
                    else {
                        setError("An unknown error occurred.");
                    }
                }
            }
        }
    };
    return (<>
      <Header />
      <main className="min-h-screen flex items-center justify-center">
        <div className="w-full max-w-md">
          <div>
            
            <div>
              <h1>
                <Link to="/">{"Bytewave Sites".replaceAll("Bytewave Sites", siteConfig.name).replaceAll("billing@bytewavesites.com", siteConfig.billingEmail)}</Link>
              </h1>
              <p>Update Your Password</p>
            </div>

            
            {error && (<FeedbackMessage type="error" message={error} onClose={() => setError(null)}/>)}

            
            <form onSubmit={handlePasswordUpdate} ref={formRef}>
              <div>
                <label className="block">
                  New Password
                </label>
                <PasswordInput className="w-full" name="updatedPassword" required autoComplete="new-password" visibilityLabel="new password" placeholder="Enter new password"/>
              </div>

              <div>
                <label className="block">
                  Confirm Password
                </label>
                <PasswordInput className="w-full" name="confirmPassword" required autoComplete="new-password" visibilityLabel="password confirmation" placeholder="Confirm new password"/>
              </div>

              <button className="w-full" type="submit">
                Update Password
              </button>
            </form>
          </div>
        </div>
      </main>
    </>);
}

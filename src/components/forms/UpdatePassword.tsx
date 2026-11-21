import React, { type FormEvent } from "react";
import PasswordInput from "../PasswordInput";
interface UpdatePasswordProps {
    error: string | null;
    passwordRef: React.RefObject<HTMLFormElement | null>;
    onSubmit: (e: FormEvent) => void;
    isLoading: boolean;
}
export default function UpdatePassword({ passwordRef, onSubmit }: UpdatePasswordProps) {
    return (<form onSubmit={onSubmit} ref={passwordRef}>
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
    </form>);
}

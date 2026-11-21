import PasswordInput from "../PasswordInput";
interface LoginFormProps {
    error: string | null;
    loginRef: React.RefObject<HTMLFormElement | null>;
    onSubmit: (e: React.SubmitEvent<HTMLFormElement>) => void;
    isLoading: boolean;
}
export default function LoginForm({ loginRef, onSubmit, isLoading }: LoginFormProps) {
    return (<form onSubmit={onSubmit} ref={loginRef}>
            <div>
              <label className="block">
                Email Address
              </label>
              <input className="w-full" type="email" name="email" required placeholder="Enter your email"/>
            </div>

            <div>
              <label className="block">
                Password
              </label>
              <PasswordInput className="w-full" name="password" required autoComplete="current-password" visibilityLabel="password" placeholder="Enter your password"/>
            </div>

            <button className="w-full" type="submit" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>);
}

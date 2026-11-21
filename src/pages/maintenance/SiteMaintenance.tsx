import { iconLabel } from "../../utils/presentation";
import { Link } from "react-router-dom";
import SEO from "../../components/SEO";
export default function InfrastructureMaintenance() {
    return (<div className="min-h-screen flex flex-col items-center justify-center">
      <SEO title="Website Maintenance"/>
      <div className="max-w-lg w-full">
        <div className="w-24 h-24 flex items-center justify-center">
          <span aria-hidden="true">{iconLabel("ri-tools-line text-yellow-400 text-5xl")}</span>
        </div>

        <h1>
          Under Maintenance
        </h1>

        <p>
          We're currently performing scheduled maintenance to improve your
          experience. We'll be back online soon — thanks for your patience!
        </p>
    

        <Link to="/login" className="inline-flex items-center justify-center">
          <div className="w-4 h-4 flex items-center justify-center">
            <span aria-hidden="true">{iconLabel("ri-login-box-line")}</span>
          </div>
          <span>Admin Login</span>
        </Link>
      </div>
    </div>);
}

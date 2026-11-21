import { iconLabel } from "../../utils/presentation";
import { Link } from "react-router-dom";
import SEO from "../../components/SEO";
export default function InfrastructureMaintenance() {
    return (<div className="min-h-screen flex flex-col items-center justify-center">
        <SEO title="Infrastructure Maintenance"/>
        <div className="max-w-lg w-full">
          <div className="w-24 h-24 flex items-center justify-center">
            <span aria-hidden="true">{iconLabel("ri-shut-down-line text-red-400 text-5xl")}</span>
          </div>

          <h1>
            Infrastructure Maintenance
          </h1>

          <p>
            We are currently performing critical infrastructure maintenance across all
            of our systems. All services are temporarily unavailable. We appreciate
            your patience.
          </p>

          <div>
            <div className="flex items-start">
              <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                <span aria-hidden="true">{iconLabel("ri-error-warning-line text-red-400 text-lg")}</span>
              </div>
              <p>
                This affects all managed websites and services. Our team is actively
                working to restore full functionality as quickly as possible.
              </p>
            </div>
          </div>

          <Link to="/login" className="inline-flex items-center justify-center">
            <div className="w-4 h-4 flex items-center justify-center">
              <span aria-hidden="true">{iconLabel("ri-login-box-line")}</span>
            </div>
            <span>Admin Login</span>
          </Link>
        </div>
      </div>);
}

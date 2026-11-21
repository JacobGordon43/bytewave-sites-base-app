import { iconLabel } from "../utils/presentation";
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';
export default function NotFound() {
    return (<div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center">
        <div className="max-w-2xl">
          <div>
            <span>404</span>
          </div>
          <h1>Page Not Found</h1>
          <p>
            Looks like this page got lost in the cloud. The page you're looking for doesn't exist or may have been moved.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-5 h-5 flex items-center justify-center">
                <span aria-hidden="true">{iconLabel("ri-home-line text-lg")}</span>
              </div>
              Back to Home
            </Link>
            <Link to="/contact" className="flex items-center gap-2">
              <div className="w-5 h-5 flex items-center justify-center">
                <span aria-hidden="true">{iconLabel("ri-mail-line text-lg")}</span>
              </div>
              Contact Support
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link className="group" to="/services">
              <div className="w-8 h-8 flex items-center justify-center">
                <span aria-hidden="true">{iconLabel("ri-code-s-slash-line text-blue-400 text-xl")}</span>
              </div>
              <h3>Services</h3>
              <p>Explore what we offer</p>
            </Link>
            <Link className="group" to="/portfolio">
              <div className="w-8 h-8 flex items-center justify-center">
                <span aria-hidden="true">{iconLabel("ri-layout-grid-line text-blue-400 text-xl")}</span>
              </div>
              <h3>Portfolio</h3>
              <p>See our past work</p>
            </Link>
            <Link className="group" to="/faq">
              <div className="w-8 h-8 flex items-center justify-center">
                <span aria-hidden="true">{iconLabel("ri-question-line text-blue-400 text-xl")}</span>
              </div>
              <h3>FAQ</h3>
              <p>Find quick answers</p>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>);
}

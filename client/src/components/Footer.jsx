import { useStoreConfig } from "../hooks/useStoreConfig";
import logoimg from "../../public/favicon.svg";
import { Link } from "react-router-dom";
import "./Footer.css";

export default function Footer() {
  const { config } = useStoreConfig();

  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div>
          <Link to="/" className="navbar-logo">
            <img src={logoimg} alt="Daily Mart Super Market" />
          </Link>

          <p className="footer-business-name">Daily Mart Super Market</p>

          <p className="footer-muted">
            Your local supermarket for groceries, snacks, drinks, personal care
            and household essentials.
          </p>

          {config.storeAddress && (
            <a
              href="https://www.google.com/maps/search/?api=1&query=Daily+Mart+Super+Market+Khajipura+Basmat+Maharashtra+431512"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-address"
            >
              📍 {config.storeAddress}
            </a>
          )}
        </div>

        <div className="footer-contact">
          {config.storePhone && <p>📞 {config.storePhone}</p>}
          {config.storeEmail && <p>✉️ {config.storeEmail}</p>}
        </div>
      </div>
      <div className="footer-strip" aria-hidden="true" />
      <div className="copyright-section">
        <p className="footer-bottom">
          © {new Date().getFullYear()} Daily Mart Super Market. All rights
          reserved.
        </p>
        <p className="developer-info">
          A digital experience crafted with design & technology by Vedant Shinde
          · Full-Stack Developer
        </p>
      </div>
    </footer>
  );
}

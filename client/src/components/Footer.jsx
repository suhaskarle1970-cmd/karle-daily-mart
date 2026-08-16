import { useStoreConfig } from "../hooks/useStoreConfig";
import "./Footer.css";

export default function Footer() {
  const { config } = useStoreConfig();

  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div>
          <h4>{config.storeName}</h4>
          <p className="footer-muted">{config.storeAddress}</p>
        </div>
        <div className="footer-contact">
          {config.storePhone && <p>📞 {config.storePhone}</p>}
          {config.storeEmail && <p>✉️ {config.storeEmail}</p>}
        </div>
      </div>
      <div className="footer-strip" aria-hidden="true" />
      <p className="footer-bottom">© {new Date().getFullYear()} {config.storeName}. All rights reserved.</p>
    </footer>
  );
}

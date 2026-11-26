import { Link } from "react-router-dom";
import wapsLogo from "../assets/img/waps_logo.png";
import styles from "../assets/PageBrand.module.css";

export default function PageBrand() {
  return (
    <Link to="/ProjectPage" className={styles.brand} aria-label="WAPs 프로젝트 페이지">
      <img src={wapsLogo} alt="WAPs" />
    </Link>
  );
}

import { useLocation, useNavigate } from "react-router-dom";
import styles from "../../assets/Admin/SideBar.module.css";
import { IconVote, IconTeamBuild, IconPermission, IconPlan } from "./icons";
import { FiUserCheck } from "react-icons/fi";

const SideBar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const activeColor = "black";
  const defaultColor = "white";

  const buttons = [
    { text: "투표 관리", path: "/admin/vote", icon: IconVote },
    { text: "팀빌딩 관리", path: "/admin/teambuild", icon: IconTeamBuild },
    {
      text: "3차 팀빌딩",
      path: "/admin/teambuild/3rd",
      icon: IconTeamBuild,
    },
    {
      text: "사용자 권한 관리",
      path: "/admin/permission",
      icon: IconPermission,
    },
    { text: "주요 행사 일정 관리", path: "/admin/plan", icon: IconPlan },
    { text: "출석체크", path: "/admin/attendance", icon: FiUserCheck },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.title}>
        <div className={styles.eng}>ADMINISTRATOR PAGE</div>
        <div className={styles.kr}>관리자 페이지</div>
      </div>
      <div className={styles.pageBtn}>
        {buttons.map((button) => {
          const isActive = location.pathname === button.path;
          const IconComponent = button.icon;

          const iconColor = isActive ? activeColor : defaultColor;

          return (
            <button
              key={button.text}
              className={isActive ? styles.active : ""}
              onClick={() => navigate(button.path)}
            >
              <IconComponent color={iconColor} size="24px" />
              {button.text}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SideBar;

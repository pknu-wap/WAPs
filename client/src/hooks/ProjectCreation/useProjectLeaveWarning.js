import { useCallback, useEffect, useRef } from "react";
import { useBlocker } from "react-router-dom";

export const LEAVE_PROJECT_MESSAGE =
  "작성 중인 내용이 저장되지 않았습니다. 페이지를 떠나시겠습니까?";

// Compare saved fields only; blank add-member rows and search text are not draft content.
export function projectDraftSnapshot(draft) {
  return JSON.stringify({
    title: draft.title || "",
    summary: draft.summary || "",
    content: draft.content || "",
    projectType: draft.projectType || "",
    password: draft.password || "",
    thumbnail: draft.thumbnail || null,
    images: (draft.images || []).filter(Boolean),
    teamMembers: (draft.teamMembers || [])
      .filter(
        (member) => member.userId || member.memberName || member.memberRole,
      )
      .map((member) => [
        member.userId ?? member.memberName,
        member.memberRole || "",
      ]),
    techStacks: (draft.techStacks || [])
      .map((stack) => `${stack.techStackType}:${stack.techStackName}`)
      .sort(),
    recruitmentPositions: (draft.recruitmentPositions || []).map((position) => [
      position.role,
      String(position.count),
    ]),
  });
}

export default function useProjectLeaveWarning(hasChanges) {
  const saved = useRef(false);
  const blocker = useBlocker(
    useCallback(
      ({ currentLocation, nextLocation }) =>
        !saved.current &&
        hasChanges &&
        (currentLocation.pathname !== nextLocation.pathname ||
          currentLocation.search !== nextLocation.search),
      [hasChanges],
    ),
  );

  useEffect(() => {
    if (!hasChanges) return;
    const beforeUnload = (event) => {
      if (saved.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [hasChanges]);

  useEffect(() => {
    if (blocker.state !== "blocked") return;
    if (window.confirm(LEAVE_PROJECT_MESSAGE)) blocker.proceed();
    else blocker.reset();
  }, [blocker]);

  return () => {
    saved.current = true;
  };
}

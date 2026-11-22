export function memberTypeLabel(profile) {
  const value = profile.memberType ?? profile.membershipLevel;
  return (
    {
      NONE: "미정",
      UNDECIDED: "미정",
      NEW: "신입",
      ASSOCIATE: "준회원",
      REGULAR: "정회원",
    }[value] ||
    value ||
    "미정"
  );
}

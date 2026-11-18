export function registrationRequired(profile) {
  if (typeof profile.registrationRequired === "boolean")
    return profile.registrationRequired;
  if (typeof profile.signupCompleted === "boolean")
    return !profile.signupCompleted;
  return undefined;
}

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

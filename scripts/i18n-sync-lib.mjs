export function buildMergeBranchName(date) {
  return `merge/upstream-${date.replaceAll("-", "")}`;
}

export function buildVerifyCommands() {
  return ["npm run lint", "npm run typecheck", "npm run test:i18n"];
}

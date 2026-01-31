export type UserRole = "admin" | "member" | string;

export type DenyReason = null | "trial_expired" | "blocked_by_admin" | "not_in_plan";

export function normalizeDashboardPath(path: string) {
  if (path === "/dashboard/workflow") return "/dashboard/workflow";
  if (path.startsWith("/dashboard/workflow/")) return "/dashboard/workflow";
  return path;
}

function isNeutralDashboardPage(normalizedPath: string) {
  return normalizedPath === "/dashboard/settings";
}

function pathMatchesPage(normalizedPath: string, pageId: string) {
  if (pageId === "/dashboard") return normalizedPath === "/dashboard";
  return normalizedPath === pageId || normalizedPath.startsWith(`${pageId}/`);
}

export function hasWildcard(pages: string[] | null | undefined) {
  return Array.isArray(pages) && pages.includes("*");
}

export function isPathBlockedByAdmin(path: string, mergedRemoves: string[]) {
  const normalized = normalizeDashboardPath(path);
  if (isNeutralDashboardPage(normalized)) return false;
  if (hasWildcard(mergedRemoves)) return true;
  return mergedRemoves.some((p) => pathMatchesPage(normalized, p));
}

export function computePageToolsEnabled(args: {
  userRole?: UserRole | null;
  path: string;
  planAllowedPages: string[] | null;
  mergedAdds: string[];
  mergedRemoves: string[];
  globallyBlocked?: boolean;
}) {
  const normalized = normalizeDashboardPath(args.path);
  if (!args.userRole || args.userRole === "admin") return true;
  if (isNeutralDashboardPage(normalized)) return true;
  if (isPathBlockedByAdmin(normalized, args.mergedRemoves)) return false;

  const adminAllowed =
    hasWildcard(args.mergedAdds) || (Array.isArray(args.mergedAdds) && args.mergedAdds.some((p) => pathMatchesPage(normalized, p)));

  if (args.globallyBlocked) return adminAllowed;
  if (adminAllowed) return true;

  const planPages = Array.isArray(args.planAllowedPages) ? args.planAllowedPages : ["*"];
  const allowed = Array.from(new Set([...planPages, ...args.mergedAdds]));
  if (hasWildcard(allowed)) return true;
  return allowed.some((p) => pathMatchesPage(normalized, p));
}

export function computeDenyReason(args: {
  userRole?: UserRole | null;
  path: string;
  planAllowedPages: string[] | null;
  mergedAdds: string[];
  mergedRemoves: string[];
  globallyBlocked?: boolean;
}): DenyReason {
  const normalized = normalizeDashboardPath(args.path);
  if (!args.userRole || args.userRole === "admin") return null;
  if (isNeutralDashboardPage(normalized)) return null;
  if (isPathBlockedByAdmin(normalized, args.mergedRemoves)) return "blocked_by_admin";

  const adminAllowed =
    hasWildcard(args.mergedAdds) || (Array.isArray(args.mergedAdds) && args.mergedAdds.some((p) => pathMatchesPage(normalized, p)));

  if (args.globallyBlocked) return adminAllowed ? null : "trial_expired";
  if (adminAllowed) return null;

  const planPages = Array.isArray(args.planAllowedPages) ? args.planAllowedPages : ["*"];
  const allowed = Array.from(new Set([...planPages, ...args.mergedAdds]));
  if (hasWildcard(allowed)) return null;
  const ok = allowed.some((p) => pathMatchesPage(normalized, p));
  return ok ? null : "not_in_plan";
}

export function canUseTool(args: {
  userRole?: UserRole | null;
  path: string;
  planAllowedPages: string[] | null;
  mergedAdds: string[];
  mergedRemoves: string[];
  toolsDisabledByPage: Record<string, string[]>;
  toolId?: string;
  globallyBlocked?: boolean;
}) {
  if (!args.userRole || args.userRole === "admin") return true;

  const normalized = normalizeDashboardPath(args.path);
  if (isNeutralDashboardPage(normalized)) return true;

  const enabled = computePageToolsEnabled({
    userRole: args.userRole,
    path: args.path,
    planAllowedPages: args.planAllowedPages,
    mergedAdds: args.mergedAdds,
    mergedRemoves: args.mergedRemoves,
    globallyBlocked: args.globallyBlocked,
  });

  if (!enabled) return false;

  if (!args.toolId) return true;
  const pageList = args.toolsDisabledByPage[normalized] ?? [];
  const wildcardList = args.toolsDisabledByPage["*"] ?? [];
  return !pageList.includes(args.toolId) && !wildcardList.includes(args.toolId);
}

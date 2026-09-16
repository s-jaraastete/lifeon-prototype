export const dashboardQueryKeys = {
  organization: (orgId: string) => ["organization", orgId] as const,
  profile: (userId: string) => ["profile", userId] as const,
  structure: (orgId: string) => ["structure", orgId] as const,
  workCenters: (orgId: string) => ["workCenters", orgId] as const,
  members: (orgId: string) => ["members", orgId] as const,
  iper: (orgId: string) => ["iper", orgId] as const,
  iperMatrix: (orgId: string, matrixId: string) => ["iper", orgId, matrixId] as const,
  planning: (orgId: string) => ["planning", orgId] as const,
  technicalDocs: (orgId: string) => ["technicalDocs", orgId] as const,
  dashboardKpis: (orgId: string, workplace?: string) =>
    ["dashboardKpis", orgId, workplace ?? "all"] as const,
  preferences: (orgId: string) => ["preferences", orgId] as const,
};

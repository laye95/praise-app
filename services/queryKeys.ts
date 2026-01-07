export const queryKeys = {
  auth: {
    session: ["auth", "session"] as const,
    user: ["auth", "user"] as const,
  },
  churches: {
    all: ["churches"] as const,
    detail: (id: string) => ["churches", id] as const,
  },
  users: {
    all: ["users"] as const,
    detail: (id: string) => ["users", id] as const,
    byChurch: (churchId: string) => ["users", "church", churchId] as const,
  },
  teams: {
    all: ["teams"] as const,
    detail: (id: string) => ["teams", id] as const,
    byChurch: (churchId: string) => ["teams", "church", churchId] as const,
    members: (teamId: string) => ["teams", "members", teamId] as const,
    myMembership: (teamId: string, userId: string) => ["teams", "membership", teamId, userId] as const,
  },
  membershipRequests: {
    all: ["membershipRequests"] as const,
    my: (userId: string) => ["membershipRequests", "user", userId] as const,
    byChurch: (churchId: string) => ["membershipRequests", "church", churchId] as const,
    detail: (id: string) => ["membershipRequests", id] as const,
  },
  permissions: {
    all: ["permissions"] as const,
    byUserChurch: (userId: string, churchId: string) => ["permissions", "user", userId, "church", churchId] as const,
    roles: (churchId: string) => ["permissions", "roles", "church", churchId] as const,
    userRoles: (churchId: string) => ["permissions", "userRoles", "church", churchId] as const,
  },
  roles: {
    all: ["roles"] as const,
    byChurch: (churchId: string) => ["roles", "church", churchId] as const,
    detail: (id: string) => ["roles", id] as const,
  },
  teamCalendar: {
    events: (teamId: string) => ["teamCalendar", "events", teamId] as const,
    event: (eventId: string) => ["teamCalendar", "event", eventId] as const,
    byDateRange: (teamId: string, start: string, end: string) =>
      ["teamCalendar", "events", teamId, start, end] as const,
    search: (teamId: string, query: string) =>
      ["teamCalendar", "search", teamId, query] as const,
  },
  teamDocuments: {
    all: (teamId: string) => ["teamDocuments", teamId] as const,
    byEvent: (teamId: string, eventId: string) =>
      ["teamDocuments", teamId, eventId] as const,
  },
  teamGroups: {
    all: (teamId: string) => ["teamGroups", teamId] as const,
    detail: (groupId: string) => ["teamGroups", "detail", groupId] as const,
    members: (groupId: string) => ["teamGroups", "members", groupId] as const,
    userGroup: (teamId: string, userId: string) =>
      ["teamGroups", "userGroup", teamId, userId] as const,
  },
} as const;

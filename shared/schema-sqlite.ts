import { sqliteTable, text, integer, index, uniqueIndex } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  createdAt: text("createdAt").default("CURRENT_TIMESTAMP"),
}, (table) => ({
  usernameIdx: uniqueIndex("idx_users_username").on(table.username),
  emailIdx: index("idx_users_email").on(table.email),
}));

export const projects = sqliteTable("projects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  path: text("path").notNull(),
  userId: integer("userId").references(() => users.id, { onDelete: 'cascade' }),
  description: text("description"),
  template: text("template"),
  createdAt: text("createdAt").default("CURRENT_TIMESTAMP"),
  updatedAt: text("updatedAt").default("CURRENT_TIMESTAMP"),
}, (table) => ({
  userIdIdx: index("idx_projects_user_id").on(table.userId),
  pathIdx: index("idx_projects_path").on(table.path),
  updatedAtIdx: index("idx_projects_updated_at").on(table.updatedAt),
}));

export const files = sqliteTable("files", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  path: text("path").notNull(),
  content: text("content"),
  projectId: integer("projectId").references(() => projects.id, { onDelete: 'cascade' }),
  isDirectory: integer("isDirectory", { mode: "boolean" }).default(false),
  createdAt: text("createdAt").default("CURRENT_TIMESTAMP"),
  updatedAt: text("updatedAt").default("CURRENT_TIMESTAMP"),
}, (table) => ({
  projectIdIdx: index("idx_files_project_id").on(table.projectId),
  pathProjectIdx: uniqueIndex("idx_files_path_project").on(table.projectId, table.path),
  nameProjectIdx: index("idx_files_name_project").on(table.projectId, table.name),
  isDirIdx: index("idx_files_is_directory").on(table.isDirectory),
}));

export const integrations = sqliteTable("integrations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'fantasma' | 'zebulon'
  userId: integer("userId").references(() => users.id),
  config: text("config"), // JSON string for configuration
  apiKey: text("apiKey"),
  isActive: integer("isActive", { mode: "boolean" }).default(false),
  createdAt: text("createdAt").default("CURRENT_TIMESTAMP"),
  updatedAt: text("updatedAt").default("CURRENT_TIMESTAMP"),
});

export const sessions = sqliteTable("sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").references(() => users.id, { onDelete: 'cascade' }),
  token: text("token").notNull().unique(),
  expiresAt: text("expiresAt").notNull(),
  createdAt: text("createdAt").default("CURRENT_TIMESTAMP"),
}, (table) => ({
  tokenIdx: uniqueIndex("idx_sessions_token").on(table.token),
  userIdIdx: index("idx_sessions_user_id").on(table.userId),
  expiresAtIdx: index("idx_sessions_expires_at").on(table.expiresAt),
}));

export const userSettings = sqliteTable("userSettings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").references(() => users.id, { onDelete: 'cascade' }).notNull().unique(),
  settings: text("settings").notNull(), // JSON string
  createdAt: text("createdAt").default("CURRENT_TIMESTAMP"),
  updatedAt: text("updatedAt").default("CURRENT_TIMESTAMP"),
}, (table) => ({
  userIdIdx: uniqueIndex("idx_user_settings_user_id").on(table.userId),
}));

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  projects: many(projects),
  integrations: many(integrations),
  sessions: many(sessions),
  settings: one(userSettings),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, {
    fields: [projects.userId],
    references: [users.id],
  }),
  files: many(files),
}));

export const filesRelations = relations(files, ({ one }) => ({
  project: one(projects, {
    fields: [files.projectId],
    references: [projects.id],
  }),
}));

export const integrationsRelations = relations(integrations, ({ one }) => ({
  user: one(users, {
    fields: [integrations.userId],
    references: [users.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(users, {
    fields: [userSettings.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
});

export const insertProjectSchema = createInsertSchema(projects).pick({
  name: true,
  path: true,
  description: true,
  template: true,
});

export const insertFileSchema = createInsertSchema(files).pick({
  name: true,
  path: true,
  content: true,
  projectId: true,
  isDirectory: true,
});

export const insertIntegrationSchema = createInsertSchema(integrations).pick({
  name: true,
  type: true,
  config: true,
  apiKey: true,
  isActive: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertFile = z.infer<typeof insertFileSchema>;
export type File = typeof files.$inferSelect;
export type InsertIntegration = z.infer<typeof insertIntegrationSchema>;
export type Integration = typeof integrations.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type UserSettings = typeof userSettings.$inferSelect;
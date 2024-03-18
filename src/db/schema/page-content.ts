import { sqliteTable, index, text, integer } from "drizzle-orm/sqlite-core";

import { relations } from "drizzle-orm";
import { auditSchema } from "./audit";
import { ApiConfig } from "../routes";
import { isAdmin, isAdminOrEditor } from "../config-helpers";

export const tableName = "pageContent";

export const route = "page-content";

export const definition = {
  id: text("id").primaryKey(),
  active: integer("active", { mode: "boolean" }).default(false),
  title: text("title"),
  description: text("description")
};

export const table = sqliteTable(
  tableName,
  {
    ...definition,
    ...auditSchema,
  },
  () => {
    return {};
  },
);

export const relation = relations(table, ({ }) => ({}));

export const access: ApiConfig["access"] = {
  operation: {
    read: true,
    create: isAdminOrEditor,
  },
  filter: {
    // if a user tries to update a post and isn't the user that created the post the update won't happen
    update: (ctx) => {
      if (isAdmin(ctx)) {
        return true;
      }

      return false;
    },
    delete: (ctx) => {
      if (isAdmin(ctx)) {
        return true;
      }

      return false;
    },
  },
  fields: {},
};
export const hooks: ApiConfig["hooks"] = {};
export const fields: ApiConfig["fields"] = {
};

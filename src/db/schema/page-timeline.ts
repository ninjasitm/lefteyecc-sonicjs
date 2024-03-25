import { sqliteTable, index, text, integer } from "drizzle-orm/sqlite-core";

import { relations } from "drizzle-orm";
import { auditSchema } from "./audit";
import { ApiConfig } from "../routes";
import { isAdmin, isAdminOrEditor } from "../config-helpers";

export const tableName = "pageTimeline";

export const route = "page-timeline";

export const definition = {
  id: text("id").primaryKey(),
  active: integer("active", { mode: "boolean" }).default(false),
  date: text("date"),
  title: text("title"),
  description: text("description"),
  icon: text("icon"),
  iconColor: text("iconColor"),
  chipText: text("chipText"),
  chipColor: text("chipColor"),
  image: text("image"),
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
  image: {
    type: "file",
    bucket: (ctx) => ctx.env.R2_STORAGE,
    path: "images",
  }
};

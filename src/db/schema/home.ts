import { sqliteTable, index, text, integer } from "drizzle-orm/sqlite-core";

import { relations } from "drizzle-orm";
import { auditSchema } from "./audit";
import { ApiConfig } from "../routes";
import { isAdmin, isAdminOrEditor } from "../config-helpers";

export const tableName = "home";

export const route = "home";

interface MediaFile {
  url: string;
  type: string;
  name: string;
  size: number;
  width: number;
  height: number;
  description: string;
}

export const definition = {
  id: text("id").primaryKey(),
  active: integer("active", { mode: "boolean" }).default(false),
  title: text("title"),
  description: text("description"),
  titles: text("titles", { mode: "json" }).$type<string[]>(),
  body: text("body"),
  photos: text("photos", { mode: "json" }).$type<MediaFile[]>(),
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

export const relation = relations(table, ({}) => ({}));

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
  photos: {
    type: "file[]",
    bucket: (ctx) => ctx.env.R2_STORAGE,
    path: "photos",
  },
  titles: {
    type: "string[]",
  },
};

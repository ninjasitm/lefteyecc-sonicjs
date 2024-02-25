import { apiConfig } from "../../db/routes";
import { AppContext } from "../../server";
import { getSchemaFromTable } from "../data/d1-data";
import { singularize } from "../util/utils";
// import Sugar from "sugar/string";
import voca from "voca";

export function getForm(ctx: AppContext, table) {
  let formFields: {
    type: string;
    key?: string;
    label: string;
    action?: string;
    defaultValue?: string;
    disabled?: boolean;
  }[] = [];

  //TODO: amke dynamic
  // const schema = `${table}Schema`;

  const schema = getSchemaFromTable(table);
  const config = apiConfig.find((tbl) => tbl.table === table);
  for (var field in schema) {
    let formField = getField(field);
    const metaType = config.fields?.[field]?.type || "auto";
    formField.metaType = metaType;
    if (formField.metaType === "auto") {
      delete formField.metaType;
    } else if (
      formField.metaType.includes("[]") &&
      formField.metaType !== "file[]"
    ) {
      const c = formField;
      formField = {
        type: "datagrid",
        label: c.label || c.key,
        key: c.key,
        components: [
          {
            ...c,
            key: `${c.key}`,
            label: singularize(c.label || c.key),
          },
        ],
      };
    }
    formFields.push(formField);
  }

  const user = ctx.get("user");
  if (user && user.userId) {
    const hasUserId = formFields.find((f) => f.key === "userId");
    if (hasUserId) {
      formFields = formFields.map((f) => {
        if (f.key === "userId") {
          f.disabled = true;
          f.defaultValue = user.userId;
        }
        return f;
      });
    }
  }

  //table reference
  formFields.push({
    type: "textfield",
    key: "table",
    label: "table",
    defaultValue: table,
    disabled: true,
  });

  //submit button
  formFields.push({
    type: "button",
    action: "submit",
    label: "Save",
  });

  return formFields;
}
interface Field {
  type: string;
  key: string;
  label: string;
  metaType?: string;
  disabled?: boolean;
  placeholder?: string;
  input?: boolean;
  tooltip?: string;
  description?: string;
  components?: Field[];
  autoExpand?: boolean;
  wysiwyg?: boolean;
  rows?: number;
}

function getField(fieldName): Field {
  const disabled = fieldName == "id";
  const type = getFieldType(fieldName);
  return {
    type,
    key: fieldName,
    label: voca.titleCase(voca.kebabCase(fieldName).replace("-", " ")),
    disabled,
    autoExpand: type === "textarea",
    wysiwyg: type === "textarea",
    rows: type === "textarea" ? 3 : undefined,
    // placeholder: "Enter your first name.",
    // input: true,
    // tooltip: "Enter your <strong>First Name</strong>",
    // description: "Enter your <strong>First Name</strong>",
  };
}

function getFieldType(fieldName) {
  switch (fieldName) {
    case "body":
      return "textarea";
      break;
  }
  return fieldName === "password" ? "password" : "textfield";
}

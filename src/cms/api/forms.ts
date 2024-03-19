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
  // console.debug("Schema", schema);
  for (var field in schema) {
    // console.debug("Field", field);
    let formField = getField(field, schema[field]);
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

  console.log("Got form fields", JSON.stringify(formFields));

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

function getField(fieldName, field = null): Field {
  const result = getFieldComponent(fieldName, field);
  // console.log("Got field", result);
  return result;
}

/**
 * Get the field json
 * @url https://formio.github.io/formio.js/app/builder.html
 * @param fieldName Get the field component for the given field name
 * @param field
 * @returns any
 */
function getFieldComponent(fieldName, field = null): any {
  const disabled = fieldName == "id";
  const type = getFieldType(fieldName, field);
  let result: any;
  switch (fieldName) {
    case 'uses':
      // result = {
      //   "label": "Edit Uses",
      //   "key": fieldName,
      //   "type": "editgrid",
      //   "input": true,
      //   "components": [
      //     {
      //       "label": "Section Title",
      //       "key": "title",
      //       "type": "textfield",
      //       "input": true
      //     },
      //     {
      //       "label": "Edit Grid",
      //       "key": "items",
      //       "type": "editgrid",
      //       "input": true,
      //       "components": [
      //         {
      //           "label": "Section Item",
      //           "applyMaskOn": "change",
      //           "key": "title",
      //           "type": "textfield",
      //           "input": true
      //         },
      //         {
      //           "label": "Item Link",
      //           "applyMaskOn": "change",
      //           "key": "link",
      //           "type": "textfield",
      //           "input": true
      //         }
      //       ]
      //     }
      //   ]
      // };
      result = {
        "label": "Uses",
        "conditionalAddButton": "show = true",
        "reorder": true,
        "addAnotherPosition": "bottom",
        "tableView": false,
        "key": fieldName,
        "type": 'datagrid',
        "input": true,
        "components": [
          {
            "label": "Section",
            "applyMaskOn": "change",
            "tableView": true,
            "key": "section",
            "type": "textfield",
            "input": true
          },
          {
            "label": "Section Items",
            "conditionalAddButton": "show = true",
            "reorder": true,
            "addAnotherPosition": "bottom",
            "defaultValue": [
              {
                "title": "",
                "link": ""
              }
            ],
            "key": "items",
            "type": "datagrid",
            "input": true,
            "components": [
              {
                "label": "Title",
                "applyMaskOn": "change",
                "tableView": true,
                "key": "title",
                "type": "textfield",
                "input": true
              },
              {
                "label": "Link",
                "applyMaskOn": "change",
                "tableView": true,
                "key": "link",
                "type": "textfield",
                "input": true
              }
            ]
          }
        ]
      }
      break;

    default:
      result = {
        type,
        key: fieldName,
        label: voca.titleCase(voca.kebabCase(fieldName).replace("-", " ")),
        disabled,
        autoExpand: type === "textarea",
        wysiwyg: type === "textarea",
        rows: type === "textarea" ? 3 : undefined,
        input: true,
        // placeholder: "Enter your first name.",
        // tooltip: "Enter your <strong>First Name</strong>",
        // description: "Enter your <strong>First Name</strong>",
      };
      break;
  }
  return result;
}

function getFieldType(fieldName, field = null) {
  console.log("Getting field type for", fieldName, field);
  if (field && field instanceof Object) {
    switch (field.config.dataType) {
      case "boolean":
        return "checkbox";
        break;

      default:
        switch (fieldName) {
          case "body":
          case "description":
            return "textarea";
            break;
        }
        return fieldName === "password" ? "password" : "textfield";
        break;
    }
  } else {
    switch (fieldName) {
      case "body":
        return "textarea";
        break;
      case 'uses':
        return 'datagrid';
        break;
    }
    return fieldName === "password" ? "password" : "textfield";
  }
}

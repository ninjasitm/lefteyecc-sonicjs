//        Formio.builder(document.getElementById('builder'), {}, {});
var contentTypeComponents;
var route;
let mode;

(function () {
  const url = new URL(window.location.href);
  route = url.pathname;

  const authMode = route.includes("/auth/");
  if (authMode) {
    route = route.replace("/auth", "");
  }
  if (url.pathname.indexOf("admin/content/new") > 0) {
    route = route.replace("/admin/content/new/", "");
    mode = "new";
  } else if (url.pathname.indexOf("admin/content/edit") > 0) {
    route = route.replace("/admin/content/edit/", "");
    mode = "edit";
  } else {
    mode = undefined;
  }
  if (authMode) {
    route = `auth/${route}`;
  }
  if (!mode) {
    return;
  }

  if (mode == "edit") {
    editContent();
  }

  if (mode.includes("new")) {
    newContent();
  }
})();

let currUppyField = "";

async function initUppy (id) {
  const { Uppy, Url, Dashboard, Tus, ImageEditor } = await import(
    "https://releases.transloadit.com/uppy/v3.21.0/uppy.min.mjs"
  );
  const uppy = new Uppy();
  uppy.use(Dashboard, {
    target: "#files-drag-drop",
    showProgressDetails: true,
    closeModalOnClickOutside: true,
  });
  uppy.use(ImageEditor, { target: Dashboard });
  const endpoint = location.origin + "/tus";
  uppy.use(Tus, {
    endpoint,
    withCredentials: true,
    headers: {
      "sonic-mode": id ? "update" : "create",
      "sonic-route": route,
      "data-id": id,
    },
  });
  return uppy;
}

function chooseFileEventHandler (uppy, event) {
  if (uppy) {
    let field = event.component.attributes["data-field"];
    const isArray = event.component.attributes["array"];
    console.log("chooseFileEventHandler", event, field, isArray);
    let tr;
    if (isArray) {
      tr = event.event.target;
      while (tr && tr.tagName !== "TR" && tr.tagName !== 'LI') {
        tr = tr.parentElement;
      }
      console.log("chooseFileEventHandler: parent", tr, tr.paentElement);
      const index = tr.tagName === 'LI' ? Array.from(tr.parentElement?.children).slice(1).indexOf(tr) : tr.rowIndex - 1;
      field = `${field}[${index}]`;
    }
    console.log("chooseFileEventHandler", field, tr, tr?.parentElement);
    currUppyField = field;
    const tus = uppy.getPlugin("Tus");
    tus.opts.headers["sonic-field"] = field;
    const dashboard = uppy.getPlugin("Dashboard");
    if (!dashboard.isModalOpen()) {
      dashboard.openModal();
    }
  }
}

let filesResponse;
let fileModal;
async function pickFileEventHandler (cb) {
  fileModal = fileModal || new bootstrap.Modal("#fileModal");

  if (filesResponse) {
    const chooseFileButtons =
      fileModal._dialog.querySelectorAll(".choose-file-btn");
    chooseFileButtons.forEach((btn) => {
      let newButton = btn.cloneNode(true);
      newButton.addEventListener("click", () => {
        const file = newButton.getAttribute("data-file");
        cb(file);
      });
      btn.parentNode.replaceChild(newButton, btn);
    });
    fileModal.show();
  } else {
    filesResponse = await axios.get("/admin/api/files");
    console.log(filesResponse.data);
    const galleryColumns =
      fileModal._dialog.querySelectorAll(".gallery-column");

    if (galleryColumns && galleryColumns.length) {
      const images = filesResponse.data.images;
      for (let i = 0; i < images.length; i++) {
        const galleryColumn = galleryColumns[i % galleryColumns.length];
        const image = images[i];
        const btn = document.createElement("button");
        btn.classList.add("choose-file-btn");
        btn.addEventListener("click", () => {
          cb(image);
        });

        btn.setAttribute("data-file", image);
        const img = document.createElement("img");
        img.src = image;
        btn.appendChild(img);
        galleryColumn.appendChild(btn);
      }
    }
    const filePane = fileModal._dialog.querySelector("#file-tab-pane");
    if (filePane) {
      const files = filesResponse.data.files;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const btn = document.createElement("button");
        btn.classList.add("choose-file-btn");
        btn.attributes["data-file"] = file;
        btn.addEventListener("click", () => {
          cb(file);
        });
        filePane.appendChild(btn);
      }
    }
    fileModal.show();
  }
}

function setupComponents (data) {
  const fileFields = data.filter(
    (c) => c.metaType === "file" || c.metaType === "file[]",
  );
  let i = 0;
  return {
    fileFields,
    contentType: data.reduce((acc, c) => {
      if (c.metaType == "file") {
        acc.push({
          ...c,
          disabled: true,
        });
        acc.push({
          ...c,
          key: undefined,
          attributes: {
            "data-field": c.key,
            key: "upload"
          },
          label: "Upload File",
          type: "button",
          action: "event",
          theme: "secondary",
          readOnly: true,
        });
        acc.push({
          ...c,
          key: undefined,
          attributes: {
            "data-field": c.key,
            key: "pick",
            "data-index": i
          },
          label: "Pick Existing",
          type: "button",
          action: "event",
          theme: "secondary",
          readOnly: true,
        });
      } else if (c.metaType == "file[]") {
        acc.push({
          label: singularize(c.label || c.key),
          key: c.key,
          type: "editgrid",
          displayAsTable: false,
          input: true,
          components: [
            {
              label: "Photos",
              attributes: {
                "data-index": i
              },
              columns: [
                {
                  components: [
                    {
                      ...c,
                      key: 'value',
                      disabled: true,
                      label: singularize(c.label || c.key),
                    }
                  ],
                  width: 3,
                  offset: 0,
                  push: 0,
                  pull: 0,
                  size: "md",
                  currentWidth: 3
                },
                {
                  components: [
                    {
                      label: "Description",
                      applyMaskOn: "change",
                      autoExpand: false,
                      tableView: true,
                      key: "description",
                      type: "textarea",
                      input: true
                    },
                    {
                      label: "Location",
                      description: "Add a location to this image.",
                      applyMaskOn: "change",
                      tableView: true,
                      key: "location",
                      type: "textfield",
                      input: true
                    },
                    {
                      label: "Date / Time",
                      format: "yyyy hh:mm a",
                      tableView: false,
                      datePicker: {
                        disableWeekends: false,
                        disableWeekdays: false
                      },
                      enableMinDateInput: false,
                      enableMaxDateInput: false,
                      key: "dateTime",
                      type: "datetime",
                      input: true,
                      widget: {
                        type: "calendar",
                        displayInTimezone: "viewer",
                        locale: "en",
                        useLocaleSettings: false,
                        allowInput: true,
                        mode: "single",
                        enableTime: true,
                        noCalendar: false,
                        format: "yyyy hh:mm a",
                        hourIncrement: 1,
                        minuteIncrement: 1,
                        time_24hr: false,
                        minDate: null,
                        disableWeekends: false,
                        disableWeekdays: false,
                        maxDate: null
                      }
                    }
                  ],
                  width: 7,
                  offset: 0,
                  push: 0,
                  pull: 0,
                  size: "md",
                  currentWidth: 7
                },
                {
                  components: [
                    {
                      key: undefined,
                      label: "Upload File",
                      attributes: {
                        "data-field": c.key,
                        array: true,
                        key: "upload",
                        "data-index": i
                      },
                      type: "button",
                      action: "event",
                      theme: "secondary",
                      readOnly: true,
                    }, {
                      ...c,
                      key: undefined,
                      attributes: {
                        "data-field": c.key,
                        key: "pick",
                        "data-index": i
                      },
                      label: "Pick Existing",
                      type: "button",
                      action: "event",
                      theme: "secondary",
                      readOnly: true,
                    }
                  ],
                  size: "md",
                  width: 2,
                  offset: 0,
                  push: 0,
                  pull: 0,
                  currentWidth: 2
                }
              ],
              key: "columns",
              type: "columns",
              input: false,
              tableView: false
            }
          ]
        });
        // acc.push({
        //   type: "editgrid",
        //   label: c.label || c.key,
        //   key: c.key,
        //   components: [
        //     {
        //       ...c,
        //       key: c.key,
        //       disabled: true,
        //       label: singularize(c.label || c.key),
        //     },
        //     // metadataGrid,
        //     {
        //       key: undefined,
        //       label: "Upload File",
        //       attributes: {
        //         "data-field": c.key,
        //         array: true,
        //         key: "upload",
        //       },
        //       type: "button",
        //       action: "event",
        //       theme: "secondary",
        //       readOnly: true,
        //     },
        //   ],
        // });
      } else if (c.metaType === 'date') {
        acc.push({
          ...c,
          ...{
            format: "MMM, d, yyyy",
            tableView: false,
            datePicker: {
              disableWeekends: false,
              disableWeekdays: false
            },
            enableMinDateInput: false,
            enableMaxDateInput: false,
            type: "datetime",
            input: true,
            widget: {
              type: "calendar",
              displayInTimezone: "viewer",
              locale: "en",
              useLocaleSettings: false,
              allowInput: true,
              mode: "single",
              enableTime: true,
              noCalendar: false,
              format: "yyyy hh:mm a",
              hourIncrement: 1,
              minuteIncrement: 1,
              time_24hr: false,
              minDate: null,
              disableWeekends: false,
              disableWeekdays: false,
              maxDate: null
            }
          }
        });
      } else {
        acc.push(c);
      }
      i++;
      return acc;
    }, []),
  };
}

function handleSubmitData (data) {
  console.log("Submit data", data);
  Object.keys(data).forEach((key) => {
    console.log("Checking submit key", key);
    const value = data[key];
    // if (Array.isArray(value)) {
    //   data[key] = value.filter((v) => v[key]).map((v) => v[key]);
    //   if (data[key].length === 0) {
    //     data[key] = null;
    //   }
    // }
    if (!data[key]) {
      data[key] = null;
    }
  });
  console.log("Submit data after", data);
  return data;
}

function getFilePreviewElement (url, isImage, i, field) {
  console.log("getFilePreviewElement", { url, isImage, i, field });
  if (i < 0) {
    i = 0;
  }
  if (url && typeof url === "string") {
    const urlParts = url.split("/");
    field = field || "";
    urlParts.forEach((part) => {
      if (part.includes("f_")) {
        field = field || part.replace("f_", "");
      }
    });
    document.querySelector(`.file-preview-${field}-${i}`)?.remove();
    const linkInner = `<div class="d-flex"><span>${url}</span><i class="ms-2 bi bi-box-arrow-up-right"></i></div>`;
    const imageInner = `<div  style="height: 140px; max-width: max-content">
          <img style="width: 100%; height: 100%; object-fit: contain" src="${url}" />
          </div>`;
    return `<a class="file-preview file-preview-${field}-${i} d-block my-2" style="text-decoration:underline" target="_blank" rel="noopener noreferrer" href="${url}">
    ${isImage ? imageInner : linkInner}
 </a>`;
  }
  console.error("bad arguments", url, isImage);
}
function onUploadSuccess (form) {
  return (file, response) => {
    if (file && response) {
      const type = file.type;
      let field = currUppyField;
      let index = -1;
      if (field.includes("[") && field.includes("]")) {
        field = currUppyField.split("[")[0];
        index = currUppyField.split("[")[1].split("]")[0];
      }
      let component = form.getComponent(field);
      let components = component.components;
      const isArray = components instanceof Array;
      if (isArray && components.length) {
        // For arrays with metadata this is the file url component
        // component = components[index].columns[0][0].component;
        component = components[index];
      }
      let element = component.element;
      if (index > -1) {
        const textComponents = component.components.filter(
          (c) => c.type === "textfield",
        );
        component = textComponents[isArray ? 0 : index] || component;
        element = document.querySelector(
          `[name="data[${field}][${index}][${field}]"]`,
        );
        if (!element) {
          element = document.querySelector(
            `[name="data[${field}][${index}][value]"]`,
          );
        }
      }
      console.log("onUploadSuccess", { field, index, form, component, element, components });
      const url = new URL(response?.uploadURL).pathname;
      if (element) {
        addPreviewElement(url, element, index, field, 'append');
        // element.insertAdjacentHTML(
        //   "afterend",
        //   getFilePreviewElement(
        //     response?.uploadURL,
        //     type.includes("image"),
        //     index,
        //   ),
        // );
      }
      if (component && response?.uploadURL) {
        console.log("onUploadSuccess: setting value", response?.uploadURL);
        component.setValue(url);
      }
    }
  };
}

const addPreviewElement = (value, element, i, field, mode) => {
  console.log("addPreviewElement", { value, element, i, field, mode });
  i = i || 0;
  if (value && element) {
    let extensions = [
      "jpg",
      "jpeg",
      "png",
      "bmp",
      "gif",
      "svg",
      "webp",
      "avif",
    ];
    let regex = new RegExp(`\\.(${extensions.join("|")})$`, "i");
    if (mode === 'replace') {
      element.innerHTML = getFilePreviewElement(value, regex.test(value), i, field);
    } else {
      element.insertAdjacentHTML(
        mode === 'append' ? 'afterend' : "beforeend",
        getFilePreviewElement(value, regex.test(value), i, field),
      )
    };
  }
};
function setupPickExistingButton (fileFields, form) {
  if (fileFields.length) {
    for (const field of fileFields) {
      console.log("setupPickExistingButton", field.key, "form", form);
      const component = form.getComponent(field.key);
      const element = component?.element;

      const trs = element.querySelectorAll("tr");
      if (trs.length) {
        for (let i = 0; i < trs.length; i++) {
          const tr = trs[i + 1];
          if (tr) {
            const button = tr.querySelector(
              `button[data-field='${field.key}']`,
            );
            const pickBtn = tr.querySelector(".btn-pick-existing");
            if (button && !pickBtn) {
              const td = tr.querySelector("td");
              const newBtn = button.cloneNode();
              newBtn.classList.add("btn-pick-existing");
              newBtn.innerText = "Pick Existing";
              newBtn.style = "margin-left: 5px";
              newBtn.addEventListener("click", () => {
                pickFileEventHandler((v) => {
                  const input = td.querySelector("input");
                  const textComponents = component.components.filter(
                    (c) => c.type === "textfield",
                  );
                  textComponents[i].setValue(v);
                  console.debug("Adding existing file", v, input, i, field.key);
                  addPreviewElement(v, input, i, field.key);
                  fileModal.hide();
                });
              });
              button.insertAdjacentElement("afterend", newBtn);
            }
          }
        }
      }
    }
  }
}
function setupFilePreviews (fileFields, form) {
  if (fileFields.length) {
    fileFields.forEach((field, index) => {
      const component = form.getComponent(field.key);
      console.log("setupFilePreviews: prepare", { field, index, _data: component._data });
      const object = component._data[field.key];
      const element = component?.element;
      console.log("setupFilePreviews: prepare complete", { index, object, element, key: field.key, object, _data: component._data });
      if (Array.isArray(object)) {
        object.forEach((v, i) => {
          console.log("setupFilePreviews: handle for array item", i, v);
          handeFilePrefiewFor(element, v.value || v[field.key] || v, i, field);
        });
      } else {
        console.log("setupFilePreviews: handle for single");
        handeFilePrefiewFor(component.element, object, index, field);
      }

      function handeFilePrefiewFor (element, value, index, field) {
        console.log("handeFilePrefiewFor", { element, value, index, field });
        let trs = Array.from(element.querySelectorAll("tr,li"));
        let v = '';
        const isEditGrid = element.querySelectorAll('li').length > 0;
        if (isEditGrid) {
          // This is because the edit grid for files has a li header
          trs = trs.slice(1);
        }
        v = v instanceof Array ? value[0] : value;
        if (trs.length) {
          console.log("Found elements for file field", { key: field.key, length: trs.length, trs });
          const tr = trs[index];
          if (tr) {
            const td = tr.querySelector("td,div[class=row]");
            v = v instanceof Object ? v.value || v[field.key] || '' : v;
            console.log("Found element data container", { tr, td, value, v, isArray: Array.isArray(value) });
            if (v != undefined && td) {
              const input = td.querySelector("input,div:first-child");
              if (v != undefined) {
                console.log("Adding preview element for array element", { v, input, index, index, field });
                addPreviewElement(v, input, index, field.key, 'prepend');
              }
            }
          }
        } else {
          console.log("Adding preview element for single element");
          addPreviewElement(value, element, 0, field.key);
        }
      }
    });
  }
}
function newContent () {
  console.log("contentType", route);

  axios.get(`/v1/form-components/${route}`).then((response) => {
    console.log(response.data);
    console.log(response.status);
    console.log(response.statusText);
    console.log(response.headers);
    console.log(response.config);

    const { fileFields, contentType } = setupComponents(response.data);
    response.data = contentType;
    Formio.icons = "fontawesome";
    // Formio.createForm(document.getElementById("formio"), {
    Formio.createForm(document.getElementById("formio"), {
      components: response.data,
    }).then(function (form) {
      let uppy;
      console.log("[newContent]: Formio form", form);
      globalThis.form = form;
      window.form = form;
      if (fileFields.length) {
        const formio = document.getElementById("formio");
        const childDiv = document.createElement("div");
        childDiv.id = "files-drag-drop";
        formio.parentNode.insertBefore(childDiv, formio);
        initUppy()
          .then((u) => {
            uppy = u;
            uppy.on("upload-success", onUploadSuccess(form));
          })
          .catch((e) => {
            console.log(e);
          });
        setupPickExistingButton(fileFields, form);
      }

      form.on("redraw", function () {
        setupPickExistingButton(fileFields, form);
        setupFilePreviews(fileFields, form);
      });
      form.on("submit", function (data) {
        data.data = handleSubmitData(data.data);
        saveNewContent(data);
      });
      form.on("change", async function (event) {
        $("#contentFormSaveButton").removeAttr("disabled");
        if (event.components) {
          contentTypeComponents = event.components;
        }
        if (event && event.changed) {
          const changedKey = event.changed.component.key;
          const fileFieldWasChanged = fileFields
            .map((f) => f.key)
            .includes(changedKey);
          if (fileFieldWasChanged) {
            setupPickExistingButton(fileFields, form);
            setupFilePreviews(fileFields, form);
          }
        }
      });
      form.on("customEvent", function (event) {
        if (event.component.attributes.key === "upload") {
          chooseFileEventHandler(uppy, event);
        } else if (event.component.attributes.key === "pick") {
          pickFileEventHandler((v) => {
            const field = event.component.attributes["data-field"];
            console.log("pickFileEventHandler", { v, field, event });
            const component = form.getComponent(field);
            component.setValue(v);
            fileModal.hide();
          });
        }
      });
    });
  });
}

function saveNewContent (data) {
  delete data.data.submit;
  delete data.data.id;

  axios.post(`/v1/${route}`, data).then((response) => {
    console.log(response.data);
    console.log(response.status);
    console.log(response.statusText);
    console.log(response.headers);
    console.log(response.config);
    if (response.status === 200 || response.status === 201) {
      location.href = `/admin/tables/${route}`;
    }
  });
}
function editContent () {
  const contentId = $("#formio").attr("data-id");
  route = $("#formio").attr("data-route");
  const routeWithoutAuth = route.replaceAll("/auth/", "/");

  axios
    .get(`/v1/${routeWithoutAuth}/${contentId}?includeContentType`)
    .then((response) => {
      const { fileFields, contentType } = setupComponents(
        response.data.contentType,
      );
      console.log("Got file fields", fileFields, contentType);
      response.data.contentType = contentType;
      // handle array values to the formio format
      if (response?.data?.data) {
        Object.keys(response.data.data).forEach((key) => {
          let value = response.data.data[key];
          try {
            value = JSON.parse(value);
          } catch (e) {
            // console.log(key, e);
            //empty by design
          }

          if (Array.isArray(value)) {
            response.data.data[key] = value.map((v) => {
              return v instanceof Object ? v : {
                [key]: v,
              };
            });
          }
        });
      }

      let uppy;
      Formio.icons = "fontawesome";
      // debugger;
      // Formio.createForm(document.getElementById("formio"), {
      Formio.createForm(document.getElementById("formio"), {
        components: response.data.contentType,
      }).then(function (form) {
        if (fileFields.length) {
          console.log("[editContent]: Formio form", form);
          globalThis.form = form;
          window.form = form;
          const formio = document.getElementById("formio");
          const childDiv = document.createElement("div");
          childDiv.id = "files-drag-drop";
          formio.parentNode.insertBefore(childDiv, formio);
          initUppy(response?.data?.data?.id)
            .then((u) => {
              uppy = u;
              uppy.on("upload-success", onUploadSuccess(form));
            })
            .catch((e) => {
              console.log(e);
            });
          setupPickExistingButton(fileFields, form);
        }
        form.on("before", function () {
          console.log("before");
        });
        form.on("render", function () {
          console.log("render");
        });
        form.on("redraw", function () {
          console.log("redraw");
          setupPickExistingButton(fileFields, form);
          setupFilePreviews(fileFields, form);
        });
        form.on("submit", function ({ data }) {
          data = handleSubmitData(data);
          if (data.id) {
            updateContent(data);
          } else {
            addContent(data);
          }
        });
        //datagrid comopnents
        const datagridComponents = form.components.filter(
          (c) => c.type === "datagrid",
        );
        console.log("datagridComponents", datagridComponents, form.components, response.data.data);
        datagridComponents.forEach((component) => {
          const key = component.component.key;
          const value = response?.data?.data?.[key];
          console.log("Checking", key, value, response.data.data);
          if (!value && response.data.data) {
            response.data.data[key] = [{}];
          }
        });
        form.submission = {
          data: response.data.data,
        };
        form.on("change", async function (event) {
          $("#contentFormSaveButton").removeAttr("disabled");
          if (event.components) {
            contentTypeComponents = event.components;
            console.log("event ->", event);
          }
          if (event && event.changed) {
            const changedKey = event.changed.component.key;
            const fileFieldWasChanged = fileFields
              .map((f) => f.key)
              .includes(changedKey);
            if (fileFieldWasChanged) {
              setupPickExistingButton(fileFields, form);
              setupFilePreviews(fileFields, form);
            }
          }
        });

        form.on("customEvent", function (event) {
          if (event.component.attributes.key === "upload") {
            chooseFileEventHandler(uppy, event);
          } else if (event.component.attributes.key === "pick") {
            pickFileEventHandler((v) => {
              const field = event.component.attributes["data-field"];
              const component = form.getComponent(field);
              component.setValue(v);
              fileModal.hide();
            });
          }
        });
      });
    });
}

function addContent (data) {
  data.key = route;

  axios.post(`/v1/${route}`, data).then((response) => {
    console.log(response.data);
    console.log(response.status);
    console.log(response.statusText);
    console.log(response.headers);
    console.log(response.config);
    if (response.status === 201 || response.status === 204) {
      location.href = "/admin";
    }
  });
}

function updateContent (data) {
  const id = data.id;
  var content = {};
  content.data = data;
  content.table = data.table;
  delete content.data.submit;
  delete content.data.contentType;
  delete content.data.id;
  delete content.data.table;
  route = $("#formio").attr("data-route");
  axios.put(`/v1/${route}/${id}`, content).then((response) => {
    console.log(response.data);
    console.log(response.status);
    console.log(response.statusText);
    console.log(response.headers);
    console.log(response.config);
    if (response.status === 200) {
      location.href = `/admin/tables/${route}`;
    } else {
      alert("Error occured updating " + data.id);
    }
  });
}
function singularize (word) {
  if (word.endsWith("ses") || word.endsWith("xes") || word.endsWith("zes")) {
    return word.slice(0, -3);
  }
  if (word.endsWith("shes") || word.endsWith("ches")) {
    return word.slice(0, -4);
  }

  if (word.endsWith("ies")) {
    return word.slice(0, -3) + "y";
  }

  return word.slice(0, -1);
}

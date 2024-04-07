// admin js
$(document).ready(function () {
  console.log("[Admin JS]: Ready");
  setupClearCacheButtons();
  setupLinkPreviewJs();
  applyTimeSince();

  $(".delete-content").on("click", function () {
    const id = $(this).attr("data-id");
    alert(`Permanantly Delete: ${id}?`);
    console.log("deleting ", id);

    axios.delete(`/v1/content/${id}`).then((response) => {
      location.href = `/admin`;
    });
  });
  // console.log(timeSince(new Date(Date.now()-aDay)));

  // debugger;
});

function applyTimeSince () {
  $(".timeSince").each(function (index, value) {
    // console.log(value);
    const timestamp = $(this).attr("datetime");
    $(this).text(timeSince(timestamp));
  });
}

function timeSince (date) {
  console.log("timesince for", date);

  var seconds = Math.floor((new Date() - date) / 1000);

  var interval = seconds / 31536000;

  if (interval > 1) {
    return Math.floor(interval) + " years ago";
  }
  interval = seconds / 2592000;
  if (interval > 1) {
    return Math.floor(interval) + " months ago";
  }
  interval = seconds / 86400;
  if (interval > 1) {
    return Math.floor(interval) + " days ago";
  }
  interval = seconds / 3600;
  if (interval > 1) {
    return Math.floor(interval) + " hours ago";
  }
  interval = seconds / 60;
  if (interval > 1) {
    return Math.floor(interval) + " minutes ago";
  }
  return Math.floor(seconds) + " seconds ago";
}

function setupClearCacheButtons () {
  $("#clear-cache-in-memory").on("click", function () {
    axios.get(`/v1/cache/clear-in-memory`).then((response) => {
      if (response.status === 200) {
        window.location = "/admin/cache/in-memory";
      }
    });
  });

  $("#clear-cache-kv").on("click", function () {
    axios.get(`/v1/cache/clear-kv`).then((response) => {
      if (response.status === 200) {
        window.location = "/admin/cache/kv";
      }
    });
  });

  $("#clear-cache-all").on("click", function () {
    axios.get(`/v1/cache/clear-all`).then((response) => {
      if (response.status === 200) {
        location.reload();
      }
    });
  });
}

function setupLinkPreviewJs () {
  setTimeout(() => {
    const inputs = $("[role='link-preview']");
    console.log("[Link Preview]: setupLinkPreviewJs", inputs);
    $("[role='link-preview']").on("blur", function () {
      const url = $(this).val();
      console.log("[Link Preview]: url", url);
      axios.get(`/admin-helper/link-preview?url=${url}`).then(function (result) {
        const data = result.data;
        console.log("[Link Preview]: Data", data);
        if (data.success) {
          const fields = [
            { selector: "[name='data\[title\]']", key: 'title', value: data.data.title },
            { selector: "[name='data\[body\]']", key: 'body', value: data.data.description },
            { selector: "[name='data\[buttonText\]']", key: 'buttonText', value: 'Read More' },
            { selector: "[name='data\[postType\]']", key: 'postType', value: 'external-link' },
            { selector: "[name='data\[image\]']", key: 'image', value: data.data.images[0] }
          ];
          console.log("Form", form);
          for (field of fields) {
            const element = $(field.selector);
            const component = form.getComponent(field.key);
            if (!component) continue;
            console.log("Component for field", { key: field.key, component, currentValue: component.getValue() });
            if (field.value && component.getValue() === "" || !component.getValue()) {
              console.log("Setting value for", field.key, field.value);
              component.setValue(field.value);
            }
            // Only fill in if a value hasn't been filled in
            // if (field.value && element.val() === "") element.val(field.value);
          }
        }
      });
    });
  }, 2000);
  // console.log("setupLinkPreviewJs", index, value);
}

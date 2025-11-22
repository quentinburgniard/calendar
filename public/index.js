(() => {
  window.ds = window.ds || {};
  ds.formSelectHandler = async (event) => {
    let parentNode = event.target.closest(".select");
    let apiID = parentNode.getAttribute("data-api-id");
    let success = false;

    if (apiID) {
      //await new Promise(resolve => setTimeout(resolve, 100000));
      await fetch(`/chataigniers/${apiID}`, {
        body: JSON.stringify({
          date: parentNode.id,
          value: event.target.getAttribute("data-value"),
        }),
        headers: {
          "content-type": "application/json",
        },
        method: "PUT",
      })
        .then((response) => {
          success = response.ok;
          return response.json();
        })
        .then((data) => {
          ds.newToast(data.message);
        });
    } else {
      await fetch(`/chataigniers?response=json`, {
        body: JSON.stringify({
          date: parentNode.id,
          value: event.target.getAttribute("data-value"),
        }),
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
      })
        .then((response) => {
          success = response.ok;
          return response.json();
        })
        .then((data) => {
          parentNode.setAttribute("data-api-id", data.id);
          parentNode
            .querySelector("i.bi-calendar4")
            .classList.replace("bi-calendar4", "bi-calendar-fill");
          ds.newToast(data.message);
        });
    }

    return success;
  };
})();

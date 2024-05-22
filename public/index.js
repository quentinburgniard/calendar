(() => {
  window.ds = window.ds || {};
  ds.formSelectHandler = async (event) => {
    let parentNode = event.target.closest('.select');
    let apiID = parentNode.getAttribute('data-api-id');
    let success = false;

    if (apiID) {
      //await new Promise(resolve => setTimeout(resolve, 100000));
      await fetch(`/chataigniers/${apiID}`, {
        body: JSON.stringify({
          date: parentNode.id,
          value: event.target.getAttribute('data-value')
        }),
        headers: {
          'content-type': 'application/json'
        },
        method: 'PUT'
      })
      .then((response) => {
        success = response.ok;
        return response.json();
      })
      .then((data) => {
        ds.newToast(data.message);
      });   
    } else {
      await fetch(`/chataigniers`, {
        body: JSON.stringify({
          date: parentNode.id,
          value: event.target.getAttribute('data-value')
        }),
        headers: {
          'content-type': 'application/json'
        },
        method: 'POST'
      })
      .then((response) => {
        success = response.ok;
        return response.json();
      })
      .then((data) => {
        ds.newToast(data.message);
      }); 
    }

    return success;
  }
})();
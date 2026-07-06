(() => {
  const addIdee = () => {
    const select = document.querySelector('[data-tipo]');
    if (!select || select.querySelector('option[value="idee"]')) return;
    const option = document.createElement('option');
    option.value = 'idee';
    option.textContent = 'idee';
    select.appendChild(option);
  };
  addIdee();
  setInterval(addIdee, 700);
})();

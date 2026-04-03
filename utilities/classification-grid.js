function buildClassificationGrid(data) {
  if (!data || data.length === 0) {
    return "<p class='notice'>No vehicles found.</p>";
  }

  let grid = '<ul class="classification-grid">';

  data.forEach(vehicle => {
    grid += `
      <li>
        <a href="/inv/detail/${vehicle.inv_id}">
          <img src="${vehicle.inv_thumbnail}" alt="${vehicle.inv_make} ${vehicle.inv_model}">
          <h2>${vehicle.inv_make} ${vehicle.inv_model}</h2>
          <span>$${vehicle.inv_price}</span>
        </a>
      </li>
    `;
  });

  grid += "</ul>";
  return grid;
}

module.exports = buildClassificationGrid;
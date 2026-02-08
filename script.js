async function loadGarage() {
    const response = await fetch('cars.json');
    const cars = await response.json();
    const container = document.getElementById('garage-grid');

    container.innerHTML = cars.map(car => `
        <a href="car-detail.html?id=${car.id}" class="thumbnail">
            <img src="${car.image}" alt="${car.name}" class="thumbnail-image" width="1" height="1" loading="lazy">
        </a>
    `).join('');
}

loadGarage();
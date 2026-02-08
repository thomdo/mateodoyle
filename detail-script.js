async function loadDetail() {
    const params = new URLSearchParams(window.location.search);
    const carId = params.get('id'); // e.g., "twin-mill-2023"

    const response = await fetch('cars.json');
    const cars = await response.json();

    // Find the car that matches the ID in the URL
    const car = cars.find(c => c.id === carId);

    if (car) {
        document.getElementById('car-name').innerText = car.name;
        document.getElementById('car-image').src = car.image;
        document.title = `${car.name} | Mateo's Garage`;
    }
}
loadDetail();
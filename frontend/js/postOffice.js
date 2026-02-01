let map;
let selectedPostOffice = null;

// Получаем orderId из URL
const urlParams = new URLSearchParams(window.location.search);
const orderId = urlParams.get("orderId");

if (!orderId) {
    alert("Заказ не найден");
    throw new Error("Нет orderId");
}

// Получаем местоположение пользователя
function getLocation() {
    if (!navigator.geolocation) {
        alert("Геолокация не поддерживается браузером");
        return;
    }

    navigator.geolocation.getCurrentPosition(
        position => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            initMap(lat, lon);
        },
        () => {
            alert("Не удалось получить местоположение. Показываем центр города по умолчанию.");
            initMap(55.751244, 37.618423); // Москва по умолчанию
        }
    );
}

// Инициализация карты Leaflet
function initMap(lat, lon) {
    if (map) map.remove();

    map = L.map('map').setView([lat, lon], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(map);

    L.marker([lat, lon]).addTo(map).bindPopup("Вы здесь").openPopup();

    loadPostOffices(lat, lon);
}

// Загрузка ближайших отделений Почты России через Overpass API
function loadPostOffices(lat, lon) {
    const radius = 5000; // радиус поиска в метрах
    const query = `
        [out:json];
        node
          ["amenity"="post_office"]
          ["operator"~"Почта России|Russian Post"]
          (around:${radius},${lat},${lon});
        out;
    `;

    fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: query
    })
    .then(res => res.json())
    .then(data => {
        if (!data.elements || data.elements.length === 0) {
            alert("Почтовые отделения не найдены рядом.");
            return;
        }

        data.elements.forEach(el => {
            const name = el.tags?.name || "Почта России";
            const postal_code = el.tags?.postal_code || "—";
            const street = el.tags?.["addr:street"] || "";
            const housenumber = el.tags?.["addr:housenumber"] || "";

            const marker = L.marker([el.lat, el.lon]).addTo(map);

            marker.bindPopup(
                `<b>${name}</b><br>${street} ${housenumber}<br>Индекс: ${postal_code}<br>
                <button onclick='selectOffice(${JSON.stringify(el)})'>
                    Выбрать это отделение
                </button>`
            );
        });
    })
    .catch(() => alert("Ошибка загрузки отделений"));
}

// Выбор отделения пользователем
function selectOffice(el) {
    selectedPostOffice = {
        osm_id: el.id,
        postal_code: el.tags?.postal_code || null,
        lat: el.lat,
        lon: el.lon,
        name: el.tags?.name || "Почта России"
    };

    document.getElementById("selectedOffice").innerHTML = `
        <b>Выбрано отделение:</b><br>
        ${selectedPostOffice.name}<br>
        Индекс: ${selectedPostOffice.postal_code || "—"}<br>
        <button onclick="savePostOffice()">Сохранить отделение</button>
    `;

    console.log("Выбранное отделение:", selectedPostOffice);
}

// Отправка выбранного отделения на сервер
function savePostOffice() {
    if (!selectedPostOffice) return alert("Выберите отделение");

    fetch("/save-post-office", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            orderId,
            selectedPostOffice
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            alert("Отделение сохранено! Теперь можно перейти к оплате.");
            window.location.href = `/payment.html?orderId=${orderId}`;
        } else {
            alert("Ошибка сохранения отделения");
        }
    })
    .catch(err => console.error(err));
}

// Запускаем получение местоположения при загрузке страницы
window.addEventListener("DOMContentLoaded", getLocation);

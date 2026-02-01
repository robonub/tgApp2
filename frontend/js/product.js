const params = new URLSearchParams(window.location.search);
const productId = params.get("id");

if (!productId) {
    document.body.innerHTML = "Товар не найден";
    throw new Error("No product id");
}

fetch(`/products/${productId}`)
    .then(res => res.json())
    .then(product => renderProduct(product))
    .catch(() => {
        document.body.innerHTML = "Ошибка загрузки товара";
    });

function renderProduct(product) {
    const container = document.getElementById("product");

    container.innerHTML = `
        <h1>${product.title}</h1>

        <div class="gallery">
            <button class="prev-btn">◀</button>
            <img class="main-img" src="/uploads/${product.images[0]}" alt="${product.title}">
            <button class="next-btn">▶</button>
        </div>

        <div class="thumbnails">
            ${product.images.map((img, i) => `<img class="thumb ${i === 0 ? "active" : ""}" src="/uploads/${img}" data-index="${i}">`).join('')}
        </div>

        <p>${product.description}</p>
        <p class="price">Цена: ${product.price} Р</p>
        <button onclick="buyProduct(${product.id})">Купить</button>
    `;

    const mainImg = container.querySelector(".main-img");
    const thumbs = container.querySelectorAll(".thumb");
    const prevBtn = container.querySelector(".prev-btn");
    const nextBtn = container.querySelector(".next-btn");
    let currentIndex = 0;

    function updateGallery(index) {
        currentIndex = index;
        mainImg.src = `/uploads/${product.images[currentIndex]}`;
        thumbs.forEach((t, i) => t.classList.toggle("active", i === currentIndex));
    }



    prevBtn.addEventListener("click", () => {
        const newIndex = (currentIndex - 1 + product.images.length) % product.images.length;
        updateGallery(newIndex);
    });

    nextBtn.addEventListener("click", () => {
        const newIndex = (currentIndex + 1) % product.images.length;
        updateGallery(newIndex);
    });

    thumbs.forEach(t => {
        t.addEventListener("click", () => updateGallery(Number(t.dataset.index)));
    });
}

function buyProduct(productId) {
    fetch("/pay", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId }) // или актуальный productId
    })
    .then(res => res.json())
    .then(data => {
    if (data.success) {
        // Относительный редирект на тот же хост, с которого загружена страница
        window.location.href = data.redirectUrl; 
    } else {
        alert("Ошибка при создании заказа");
    }
    })
    .catch(err => console.error(err));

}

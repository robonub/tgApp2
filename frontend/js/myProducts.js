// ------------------ Проверка авторизации ------------------
async function checkAuth() {
    console.log("🔍 Проверка авторизации...");
    try {
        const res = await fetch("/profile", {  // <-- Относительный путь!
            credentials: "include"
        });

        console.log("📡 Ответ сервера:", res.status, res.ok);

        if (!res.ok) {
            console.log("❌ Не авторизован, редирект на login");
            window.location.href = "login.html";
            return null;
        }

        const data = await res.json();
        console.log("✅ Авторизован:", data);
        document.getElementById("userInfo").textContent = `Вы вошли как ${data.email}`;
        return data;
    } catch (err) {
        console.error("💥 Auth error:", err);
        window.location.href = "login.html";
        return null;
    }
}

// ------------------ Загрузка моих товаров ------------------
async function loadMyProducts() {
    console.log("📦 Загрузка товаров...");
    try {
        const res = await fetch("/my-products", {  // <-- Относительный путь!
            credentials: "include"
        });

        console.log("📡 Ответ /my-products:", res.status);

        if (!res.ok) {
            throw new Error("Ошибка загрузки товаров");
        }

        const products = await res.json();
        console.log("✅ Получено товаров:", products.length);
        displayProducts(products);
    } catch (err) {
        console.error("💥 Error loading products:", err);
        document.getElementById("productsContainer").innerHTML = 
            "<p>Ошибка загрузки товаров</p>";
    }
}

// ------------------ Отображение товаров ------------------
function displayProducts(products) {
    const container = document.getElementById("productsContainer");
    
    if (products.length === 0) {
        container.innerHTML = "<p>У вас пока нет товаров</p>";
        return;
    }

    container.innerHTML = "";

    products.forEach(product => {
        const card = document.createElement("div");
        card.className = "product-card";

        const images = Array.isArray(product.images) ? product.images : [];
        const imageTag = images.length > 0 
            ? `<img src="/uploads/${images[0]}" alt="${product.title}">` // <-- Относительный путь!
            : '';

        card.innerHTML = `
            ${imageTag}
            <h3>${product.title}</h3>
            <p>${product.description}</p>
            <p class="price">${product.price} Р</p>
            <div class="product-actions">
                <button class="edit" data-id="${product.id}">Редактировать</button>
                <button class="delete" data-id="${product.id}">Удалить</button>
            </div>
        `;

        // Удаление товара
        card.querySelector(".delete").onclick = async () => {
            if (!confirm("Удалить товар?")) return;

            try {
                const res = await fetch(`/products/${product.id}`, {  // <-- Относительный путь!
                    method: "DELETE",
                    credentials: "include"
                });

                if (res.ok) {
                    card.remove();
                } else {
                    alert("Ошибка удаления товара");
                }
            } catch (err) {
                console.error("Delete error:", err);
                alert("Ошибка удаления товара");
            }
        };

        // Редактирование товара
        card.querySelector(".edit").onclick = () => {
            window.location.href = `editProduct.html?id=${product.id}`;
        };

        container.appendChild(card);
    });
}

// ------------------ Инициализация ------------------
async function init() {
    console.log("🚀 Инициализация страницы...");
    const user = await checkAuth();
    if (user) {
        await loadMyProducts();
    }
}

init();
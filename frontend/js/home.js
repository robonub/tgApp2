document.addEventListener("DOMContentLoaded", () => {
    const userInfo = document.getElementById("userInfo");
    const searchInput = document.getElementById("searchInput");
    const searchBtn = document.getElementById("searchBtn");
    const productsContainer = document.getElementById("productsContainer");

    // ------------------ Проверка авторизации ------------------
    async function checkAuth() {
        try {
            const res = await fetch("/profile", { credentials: "include" });
            if (!res.ok) return window.location.href = "login.html";

            const user = await res.json();
            userInfo.textContent = `Вы вошли как ${user.email || "неизвестно"}`;
        } catch (err) {
            console.error(err);
            window.location.href = "login.html";
        }
    }

    // ------------------ Logout ------------------
    const logoutBtn = document.getElementById("logout");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
            try {
                await fetch("/logout", { method: "POST", credentials: "include" });
                window.location.href = "login.html";
            } catch (err) {
                console.error(err);
                window.location.href = "login.html";
            }
        });
    }

    // ------------------ Загрузка товаров ------------------
    async function loadProducts(search = "") {
        try {
            const url = search ? `/products?search=${encodeURIComponent(search)}` : "/products";
            const res = await fetch(url, { credentials: "include" });
            const data = await res.json();

            productsContainer.innerHTML = "";

            data.forEach(product => {
                const card = document.createElement("div");
                card.classList.add("product-card");

                // Ссылка на страницу товара
                const link = document.createElement("a");
                link.href = `product.html?id=${product.id}`;
                link.classList.add("product-link");

                // Картинка
                const img = document.createElement("img");
                const images = Array.isArray(product.images) ? product.images : [];
                img.src = images.length ? `/uploads/${images[0]}` : "/placeholder.png";
                img.alt = product.title;
                img.classList.add("product-image");

                // Название
                const title = document.createElement("h3");
                title.textContent = product.title;

                // Цена
                const price = document.createElement("p");
                price.textContent = `Цена: ${product.price} Р`;
                price.classList.add("product-price");

                // Кнопка
                const buyBtn = document.createElement("button");
                buyBtn.textContent = "Купить";
                buyBtn.addEventListener("click", () => {
                    window.location.href = `product.html?id=${product.id}`;
                });

                link.append(img, title);
                card.append(link, price, buyBtn);
                productsContainer.appendChild(card);
            });
        } catch (err) {
            console.error("Ошибка загрузки товаров:", err);
        }
    }

    // ------------------ Поиск товаров ------------------
    async function searchProducts() {
        const query = searchInput.value.trim();
        loadProducts(query);
    }

    if (searchBtn && searchInput) {
        searchBtn.addEventListener("click", searchProducts);
        searchInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") searchProducts();
        });
    }

    // ------------------ Инициализация ------------------
    checkAuth();
    loadProducts();
});

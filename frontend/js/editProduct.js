// ------------------ DOM элементы ------------------
const editForm = document.getElementById("editForm");
const titleInput = document.getElementById("title");
const descriptionInput = document.getElementById("description");
const priceInput = document.getElementById("price");
const currentImagesContainer = document.getElementById("currentImages");
const newImagesInput = document.getElementById("newImages");
const messageEl = document.getElementById("message");

// ------------------ Проверка авторизации ------------------
async function checkAuth() {
    try {
        const res = await fetch("/profile", { credentials: "include" });
        if (!res.ok) {
            window.location.href = "login.html";
            return null;
        }
        const data = await res.json();
        document.getElementById("userInfo").textContent = `Вы вошли как ${data.email}`;
        return data;
    } catch (err) {
        console.error(err);
        window.location.href = "login.html";
        return null;
    }
}

// ------------------ Получение ID товара ------------------
const params = new URLSearchParams(window.location.search);
const productId = params.get("id");
if (!productId) {
    alert("Товар не найден");
    window.location.href = "myProducts.html";
}

// ------------------ Загрузка товара ------------------
let currentImages = [];

async function loadProduct() {
    try {
        const res = await fetch(`/products/${productId}`, { credentials: "include" });
        if (!res.ok) throw new Error("Товар не найден");

        const product = await res.json();

        titleInput.value = product.title;
        descriptionInput.value = product.description;
        priceInput.value = product.price;

        currentImages = product.images || [];
        renderCurrentImages();
    } catch (err) {
        console.error(err);
        alert("Ошибка загрузки товара");
        window.location.href = "myProducts.html";
    }
}

// ------------------ Отрисовка текущих изображений ------------------
function renderCurrentImages() {
    currentImagesContainer.innerHTML = "<p>Текущие изображения:</p>";
    if (currentImages.length === 0) {
        currentImagesContainer.innerHTML += "<p>Нет изображений</p>";
        return;
    }

    currentImages.forEach((imgPath, index) => {
        const wrapper = document.createElement("div");
        wrapper.style.display = "inline-block";
        wrapper.style.position = "relative";
        wrapper.style.margin = "5px";

        const img = document.createElement("img");
        img.src = `/uploads/${imgPath}`;
        img.style.width = "100px";
        img.style.borderRadius = "8px";

        const delBtn = document.createElement("button");
        delBtn.textContent = "✖";
        delBtn.style.position = "absolute";
        delBtn.style.top = "0";
        delBtn.style.right = "0";
        delBtn.style.background = "rgba(255,0,0,0.7)";
        delBtn.style.color = "white";
        delBtn.style.border = "none";
        delBtn.style.borderRadius = "50%";
        delBtn.style.cursor = "pointer";
        delBtn.style.width = "20px";
        delBtn.style.height = "20px";
        delBtn.addEventListener("click", () => {
            currentImages.splice(index, 1);
            renderCurrentImages();
        });

        wrapper.append(img, delBtn);
        currentImagesContainer.appendChild(wrapper);
    });
}

// ------------------ Сохранение изменений ------------------
editForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("title", titleInput.value);
    formData.append("description", descriptionInput.value);
    formData.append("price", priceInput.value);

    // Добавляем новые файлы
    if (newImagesInput.files.length > 0) {
        for (let file of newImagesInput.files) {
            formData.append("images", file);
        }
    }

    // Передаем текущие (оставшиеся) изображения для сервера
    formData.append("keepImages", JSON.stringify(currentImages));

    try {
        const res = await fetch(`/products/${productId}`, {
            method: "PUT",
            credentials: "include",
            body: formData
        });

        const data = await res.json();

        if (res.ok) {
            messageEl.textContent = "Товар обновлён!";
            messageEl.style.color = "green";
            setTimeout(() => window.location.href = "myProducts.html", 1000);
        } else {
            messageEl.textContent = data.error || "Ошибка обновления";
            messageEl.style.color = "red";
        }
    } catch (err) {
        console.error("Error updating product:", err);
        messageEl.textContent = "Ошибка сети";
        messageEl.style.color = "red";
    }
});

// ------------------ Отмена ------------------
document.getElementById("cancelBtn").addEventListener("click", () => {
    window.location.href = "myProducts.html";
});

// ------------------ Инициализация ------------------
async function init() {
    const user = await checkAuth();
    if (user) await loadProduct();
}

init();

const form = document.getElementById("productForm");
const message = document.getElementById("message");

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "login.html";
        return;
    }

    const formData = new FormData(form);

    try {
        const res = await fetch("/products", {
            method: "POST",
            headers: {
                "Authorization": "Bearer " + token
            },
            body: formData
        });

        const data = await res.json();

        if (res.ok) {
            message.textContent = "Товар добавлен!";
            message.style.color = "green";
            form.reset();
        } else {
            message.textContent = data.error;
            message.style.color = "red";
        }

    } catch (err) {
        message.textContent = "Ошибка сети";
        message.style.color = "red";
    }
});

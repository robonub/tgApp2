const form = document.getElementById("loginForm");
const message = document.getElementById("message");

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        const res = await fetch("/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include", // ✅ cookie сохраняется
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (data.success) {
            message.textContent = "Вы вошли!";
            message.style.color = "green";

            setTimeout(() => {
                window.location.href = "home.html";
            }, 500);
        } else {
            message.textContent = data.error;
            message.style.color = "red";
        }

    } catch (err) {
        console.error(err);
        message.textContent = "Ошибка сети";
        message.style.color = "red";
    }
});

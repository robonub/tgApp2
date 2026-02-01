const form = document.getElementById("registerForm");
const message = document.getElementById("message");

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        const response = await fetch("/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (data.success) {
            message.textContent = `Вы успешно зарегистрировались, ${email}!`;
            message.style.color = "green";

            // ⏳ маленькая пауза, чтобы пользователь увидел сообщение
            setTimeout(() => {
                window.location.href = "login.html";
            }, 1000);

        } else {
            message.textContent = `Ошибка: ${data.error}`;
            message.style.color = "red";
        }
    } catch (err) {
        message.textContent = `Ошибка сети`;
        message.style.color = "red";
    }
});

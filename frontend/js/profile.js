fetch("/profile", {
    credentials: "include"
})
.then(res => {
    if (res.status === 401) {
        window.location.href = "login.html";
    }
    return res.json();
})
.then(user => {
    userInfo.textContent = `Вы вошли как ${user.email}`;
    document.getElementById("email").textContent = user.email;
    document.getElementById("name").textContent = user.name || "Не указано";
    document.getElementById("createdAt").textContent = user.createdAt || "-";
});

const logoutBtn = document.getElementById("logout");
if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
        try {
                await fetch("/logout", {
                    method: "POST",
                    credentials: "include"
                });
                window.location.href = "login.html";
            } catch (err) {
                console.error("Logout error:", err);
                window.location.href = "login.html";
            }
        });         
}
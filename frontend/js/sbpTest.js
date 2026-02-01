const params = new URLSearchParams(window.location.search);
const paymentId = params.get("paymentId");

document.getElementById("info").textContent =
    `Платёж №${paymentId}`;

document.getElementById("payBtn").addEventListener("click", () => {
    fetch("/pay/confirm", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ paymentId })
    })
    .then(() => {
        alert("Оплата успешна");
        window.location.href = "home.html";
    });
});

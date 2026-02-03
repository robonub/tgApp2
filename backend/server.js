const express = require("express");
const bcrypt = require("bcrypt");
const pool = require("./db");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const path = require("path");
require("dotenv").config

const app = express();
const SECRET_KEY = process.env.SECRET_KEY;
const cors = require("cors");

app.use(cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000","https://tg-miniapp-kwsg.onrender.com"],
    credentials: true
}));

// ================= Middlewares =================
app.use(express.json());
app.use(cookieParser());

// ================= JWT Auth Middleware =================
function authenticateToken(req, res, next) {
    const token = req.cookies.token;
    
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ error: "Forbidden" });
        req.user = user;
        next();
    });
}

// ================= Rate limiter =================
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false
});

// ================= AUTH =================
app.post("/register", async (req, res) => {
    const { email, password } = req.body;
    try {
        const hash = await bcrypt.hash(password, 10);
        await pool.query(
            "INSERT INTO users (email, password_hash) VALUES ($1, $2)",
            [email, hash]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post("/login", loginLimiter, async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
        );
        const user = result.rows[0];
        if (!user) return res.status(400).json({ success: false, error: "Пользователь не найден" });

        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) return res.status(400).json({ success: false, error: "Неверный пароль" });

        const token = jwt.sign({ userId: user.id, email: user.email }, SECRET_KEY, { expiresIn: "2h" });

        res.cookie("token", token, {
            httpOnly: true,
            sameSite: "none",
            secure: true,
            maxAge: 2 * 60 * 60 * 1000
        });


        res.json({ success: true, email: user.email });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post("/logout", (req, res) => {
    res.clearCookie("token", { 
        path: "/",
        sameSite: "lax"
    });
    res.json({ success: true });
});

// ================= Profile =================
app.get("/profile", authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT email, created_at FROM users WHERE id = $1",
            [req.user.userId]
        );
        res.json({
            email: result.rows[0].email,
            createdAt: result.rows[0].created_at
        });
    } catch (err) {
        res.status(500).json({ error: "Ошибка сервера" });
    }
});

// ================= Products =================
app.get("/products", async (req, res) => {
    const { search } = req.query;
    try {
        let productsRes;
        if (search) {
            productsRes = await pool.query(
                "SELECT * FROM products WHERE LOWER(title) LIKE LOWER($1) ORDER BY created_at DESC",
                [`%${search}%`]
            );
        } else {
            productsRes = await pool.query(
                "SELECT * FROM products ORDER BY created_at DESC"
            );
        }

        const products = await Promise.all(
            productsRes.rows.map(async (product) => {
                const imagesRes = await pool.query(
                    "SELECT image_path FROM product_images WHERE product_id = $1 ORDER BY id",
                    [product.id]
                );
                product.images = imagesRes.rows.map(row => row.image_path);
                return product;
            })
        );

        res.json(products);
    } catch (err) {
        console.error("Ошибка сервера при получении товаров:", err);
        res.status(500).json({ error: "Ошибка сервера" });
    }
});



app.get("/products/:id", async (req, res) => {
    try {
        const { id } = req.params;
        
        const productRes = await pool.query(
            "SELECT * FROM products WHERE id = $1",
            [id]
        );
        
        if (productRes.rows.length === 0) {
            return res.status(404).json({ error: "Товар не найден" });
        }
        
        const product = productRes.rows[0];
        
        const imagesRes = await pool.query(
            "SELECT image_path FROM product_images WHERE product_id = $1 ORDER BY id",
            [id]
        );
        
        product.images = imagesRes.rows.map(row => row.image_path);
        
        res.json(product);
    } catch (err) {
        console.error("Error fetching product:", err);
        res.status(500).json({ error: "Ошибка сервера" });
    }
});

app.get("/my-products", authenticateToken, async (req, res) => {
    try {
        const productsRes = await pool.query(
            "SELECT * FROM products WHERE user_id = $1 ORDER BY created_at DESC",
            [req.user.userId]
        );
        
        const products = await Promise.all(
            productsRes.rows.map(async (product) => {
                const imagesRes = await pool.query(
                    "SELECT image_path FROM product_images WHERE product_id = $1 ORDER BY id",
                    [product.id]
                );
                
                product.images = imagesRes.rows.map(row => row.image_path);
                return product;
            })
        );
        
        res.json(products);
    } catch (err) {
        console.error("Error fetching my products:", err);
        res.status(500).json({ error: "Ошибка сервера" });
    }
});

app.delete("/products/:id", authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            "DELETE FROM products WHERE id = $1 AND user_id = $2",
            [id, req.user.userId]
        );
        if (result.rowCount === 0) return res.status(403).json({ error: "Нет прав" });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Ошибка сервера" });
    }
});

const upload = require("./upload"); // твой файл multer.js

// Изменение товара с картинками
app.put("/products/:id", authenticateToken, upload.array("images", 10), async (req, res) => {
    const { id } = req.params;
    const { title, description, price, deleteImages } = req.body;

    try {
        const result = await pool.query(
            "UPDATE products SET title=$1, description=$2, price=$3 WHERE id=$4 AND user_id=$5",
            [title, description, price, id, req.user.userId]
        );

        if (result.rowCount === 0) return res.status(403).json({ error: "Нет прав" });

        // Удаляем отмеченные картинки
        if (deleteImages) {
            const imagesToDelete = JSON.parse(deleteImages);
            for (let img of imagesToDelete) {
                await pool.query("DELETE FROM product_images WHERE product_id=$1 AND image_path=$2", [id, img]);
                const fsPath = path.join(__dirname, "..", "uploads", img);
                if (fs.existsSync(fsPath)) fs.unlinkSync(fsPath);
            }
        }

        // Добавляем новые файлы
        if (req.files && req.files.length > 0) {
            for (let file of req.files) {
                await pool.query("INSERT INTO product_images (product_id, image_path) VALUES ($1, $2)", [id, file.filename]);
            }
        }

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Ошибка сервера" });
    }
});

// ===================== Платежи =====================
// Создаем простой in-memory "хранилище" платежей
const payments = {}; // { paymentId: { productId, status } }
let nextPaymentId = 1;

// Маршрут создания платежа
// ===================== Платежи / выбор отделения =====================
const orders = {}; // Простое in-memory хранилище заказов
let nextOrderId = 1;

app.post("/pay", authenticateToken, async (req, res) => {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ error: "Нет productId" });

    try {
        // Проверяем, существует ли товар
        const productRes = await pool.query(
            "SELECT * FROM products WHERE id = $1",
            [productId]
        );
        if (productRes.rows.length === 0) return res.status(404).json({ error: "Товар не найден" });

        // Создаем заказ
        const orderId = nextOrderId++;
        orders[orderId] = {
            productId,
            userId: req.user.userId,
            status: "awaiting_post_office",
            postOffice: null,
        };

        console.log("Создан заказ:", orders[orderId]);

        // Редирект на страницу выбора отделения
        // Передаем orderId в query params
        res.json({
            success: true,
            orderId,
            redirectUrl: `/postOffice.html?orderId=${orderId}`
        });

    } catch (err) {
        console.error("Ошибка создания заказа:", err);
        res.status(500).json({ error: "Ошибка сервера" });
    }
});


// Подтверждение платежа
app.post("/pay/confirm", authenticateToken, async (req, res) => {
    const { paymentId } = req.body;
    if (!paymentId || !payments[paymentId]) return res.status(400).json({ error: "Неверный paymentId" });

    try {
        const payment = payments[paymentId];
        if (payment.status === "paid") return res.status(400).json({ error: "Платеж уже проведен" });

        // Тут можно обновить таблицу заказов или статусы товаров, если нужно
        payment.status = "paid";

        res.json({ success: true });
    } catch (err) {
        console.error("Ошибка подтверждения платежа:", err);
        res.status(500).json({ error: "Ошибка сервера" });
    }
});


app.get("/ping", (req, res) => {
    res.json({ pong: true });
});

const PORT = process.env.PORT || 3000;


// Раздаём статику
app.use(express.static(path.join(__dirname, "..", "frontend")));
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});

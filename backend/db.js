const { Pool } = require("pg");

const pool = new Pool({
    user: "postgres",
    host: "localhost",
    database: "marketplace",
    password: "AOP@*#JcMAC:PASD9c210", // пароль, который ты задавал при установке
    port: 5432
});

module.exports = pool;

const express = require("express");
const { chromium } = require("playwright");

const app = express();
app.use(express.static("public"));

async function consultarSimit(placa) {

    const browser = await chromium.launch({
        headless: true,   // 🔥 más rápido
        args: ["--no-sandbox"]
    });

    const page = await browser.newPage();

    try {

        await page.goto("https://consulta-simit.com.co/", {
            waitUntil: "domcontentloaded",
            timeout: 60000
        });
     

        await page.fill("#txtBusqueda", placa);
        await page.click("#consultar");

        // esperar tabla
        await page.waitForSelector("table", { timeout: 20000 });

        const data = await page.evaluate(() => {

            const filas = Array.from(document.querySelectorAll("table tr"))
                .map(tr => tr.innerText.trim())
                .filter(t => t.length > 20);

            if (filas.length < 2) return [];

            const headers = filas[0].split("\t")
                .map(h => h.toLowerCase().replace(/ /g, "_"));

            let resultados = [];

            for (let i = 1; i < filas.length; i++) {

                const valores = filas[i].split("\t");
                let obj = {};

                headers.forEach((h, j) => {
                    obj[h] = valores[j] || "";
                });

                resultados.push(obj);
            }

            return resultados;
        });

        await browser.close();
        return data;

    } catch (err) {
        await browser.close();
        return [{ error: err.message }];
    }
}

app.get("/simit/:placa", async (req, res) => {
    const placa = req.params.placa.toUpperCase();
    const data = await consultarSimit(placa);
    res.json(data);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor listo en puerto ${PORT}`);
});
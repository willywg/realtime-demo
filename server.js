import express from "express";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import "dotenv/config";

const app = express();
const port = process.env.PORT || 3000;
const apiKey = process.env.OPENAI_API_KEY;

// Configure Vite middleware for React client
const vite = await createViteServer({
  server: { middlewareMode: true },
  appType: "custom",
});
app.use(vite.middlewares);

// API route for token generation
app.get("/token", async (req, res) => {
  try {
    const response = await fetch(
      "https://api.openai.com/v1/realtime/sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // model: "gpt-4o-realtime-preview-2024-12-17",
          model: "gpt-4o-mini-realtime-preview",
          voice: "coral",
          instructions: `
Tu nombre es Shoppy y eres la asistente virtual de Shoppy en nuestra web https://shoppy.chat.

Tu función es atender a los visitantes e impulsar la suscripción a Shoppy por parte de las empresas y personas que nos visitan, dándole  toda información sobre el servicio de asistentes virtuales que ofrecemos. Debes ser altamente proactiva y vendedora, pero sobre todo amena, graciosa y con gran sentido del humor.

Ofrece a los visitante toda la información sobre los asistentes virtuales, pero destaca constantemente las ventajas y beneficios que tiene usar un asistente virtual como tú en las páginas web y plataformas de e-commerce de las empresas que nos visitan. También puedes interactuar con los clientes via Whatsapp, Meta Messenger e Instagram y tenemos plugins para Woocomerce (Wordpress).

En Shoppy nos dedicamos a ofrecer asistentes virtuales con IA para acelerar las ventas de las empresas, atender todo tipo de consultas de los clientes sobre los productos o servicios, captar leads de potenciales clientes, agendar citas, llamadas o atenciones online o presenciales a los clientes, identificar a potenciales clientes de alto valor y contactarlos con un humano inmediatamente, hacer búsquedas de productos o servicios para el usuario y atender el negocio 24/7.

Haz todo el esfuerzo necesario para convencer al visitante a que se suscriba a Shoppy. Tenemos un plan gratuito que ofrece todas las funcionalidades para poder probar el asistentes en la web del cliente, sin pagos previos ni ingresar tarjeta de crédito y que todos los meses da nuevos créditos de consumo sin ningún costo.

Dale al usuario toda la información que solicita y solo en caso no dispongas de la información actualizada, puedes referirlo a algún enlace de nuestra web de Shoppy que pudiera contener esa información, de lo contrario, dale la información en el chat.

No proporciones enlaces de descarga de documentos, pdf etc. Si te piden los precios o planes de Shoppy puedes referirlos a la página de planes y precios en https://shoppy.chat/planes

# Tipo de Voz
Voz: Cálida, empática y profesional, asegurando al cliente que su problema se comprende y se resolverá.
Puntuación: Bien estructurada, con pausas naturales, lo que permite claridad y un flujo constante y tranquilo.
Expresión: Tranquila y paciente, con un tono comprensivo y de apoyo que tranquiliza al oyente.`
        }),
      },
    );

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Token generation error:", error);
    res.status(500).json({ error: "Failed to generate token" });
  }
});

// Render the React client
app.use("*", async (req, res, next) => {
  const url = req.originalUrl;

  try {
    const template = await vite.transformIndexHtml(
      url,
      fs.readFileSync("./client/index.html", "utf-8"),
    );
    const { render } = await vite.ssrLoadModule("./client/entry-server.jsx");
    const appHtml = await render(url);
    const html = template.replace(`<!--ssr-outlet-->`, appHtml?.html);
    res.status(200).set({ "Content-Type": "text/html" }).end(html);
  } catch (e) {
    vite.ssrFixStacktrace(e);
    next(e);
  }
});

app.listen(port, () => {
  console.log(`Express server running on *:${port}`);
});

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "15mb" }));

  const apiKey = process.env.GEMINI_API_KEY;
  const ai = apiKey
    ? new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      })
    : null;

  // API endpoint for receipt classification
  app.post("/api/classify-receipt", async (req, res) => {
    try {
      if (!ai) {
        return res.status(500).json({
          error: "API de Gemini no configurada. Por favor, agregue la clave GEMINI_API_KEY en la configuración.",
        });
      }

      const { base64Image, mimeType } = req.body;
      if (!base64Image) {
        return res.status(400).json({ error: "Falta la imagen base64 del recibo." });
      }

      let cleanBase64 = base64Image;
      let cleanMimeType = mimeType || "image/jpeg";

      if (base64Image.startsWith("data:")) {
        const matches = base64Image.match(/^data:([^;]+);base64,(.*)$/);
        if (matches && matches.length === 3) {
          cleanMimeType = matches[1];
          cleanBase64 = matches[2];
        }
      }

      const imagePart = {
        inlineData: {
          mimeType: cleanMimeType,
          data: cleanBase64,
        },
      };

      const promptPart = {
        text: `Analiza esta imagen de ticket, factura o recibo de compra. Extrae y clasifica los detalles del gasto para un instalador eléctrico independiente. Los gastos se deben clasificar en una de estas categorías específicas del rubro eléctrico listadas abajo. Asegúrate de clasificarlo exactamente en una de ellas:
- "Materiales Eléctricos" (e.g. cables, térmicas, interruptores, cajas, caños, etc.)
- "Herramientas" (e.g. pinzas, multímetros, taladros, buscador de fase, etc.)
- "Transporte y Combustible" (vehículo de obra, combustible, peajes)
- "Servicios y Oficina" (abono móvil, internet, presupuestos, contabilidad)
- "E.P.P. y Seguridad" (ropa de trabajo dieléctrica, guantes, calzado de seguridad)
- "Otros Gastos" (comidas, cafetería en obra, imprevistos)

Determina el monto total de la transacción como número, el nombre del proveedor o comercio, la fecha (usa YYYY-MM-DD, si no la encuentras usa la fecha de hoy que es 2026-06-18) y una breve descripción en español de los artículos comprados. Devuelve un objeto JSON estructurado que cumpla con el esquema requerido.`,
      };

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: { parts: [imagePart, promptPart] },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              amount: {
                type: Type.NUMBER,
                description: "Monto total facturado en el recibo. Debe ser un número decimal o entero.",
              },
              category: {
                type: Type.STRING,
                description: "La categoría extraída. Debe ser estrictamente una de las detalladas.",
              },
              provider: {
                type: Type.STRING,
                description: "Nombre de la empresa o proveedor que emitió el ticket o factura.",
              },
              date: {
                type: Type.STRING,
                description: "Fecha del recibo en formato YYYY-MM-DD.",
              },
              description: {
                type: Type.STRING,
                description: "Resumen muy breve de los materiales o conceptos comprados.",
              },
            },
            required: ["amount", "category", "provider", "date", "description"],
          },
        },
      });

      const resultText = response.text;
      if (!resultText) {
        return res.status(500).json({ error: "No se pudo extraer el texto de la respuesta del modelo Gemini." });
      }

      const parsedData = JSON.parse(resultText.trim());
      res.json(parsedData);
    } catch (err: any) {
      console.error("Error classifying receipt:", err);
      res.status(500).json({
        error: "Error interno al clasificar el recibo: " + (err.message || String(err)),
      });
    }
  });

  // Serve static dist in production, or mount Vite in dev mode
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();

import { GoogleGenAI, Type } from "@google/genai";

export default async function handler(req: any, res: any) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "API de Gemini no configurada. Por favor, configure GEMINI_API_KEY en variables de entorno en Vercel.",
    });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build-vercel",
        },
      },
    });

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
    return res.status(200).json(parsedData);
  } catch (err: any) {
    console.error("Error classifying receipt on Vercel:", err);
    return res.status(500).json({
      error: "Error interno al clasificar el recibo: " + (err.message || String(err)),
    });
  }
}

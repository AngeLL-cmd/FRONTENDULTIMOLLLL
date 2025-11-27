/**
 * Servidor Proxy Simple para la API de RENIEC
 * 
 * Este servidor actúa como proxy para evitar problemas de CORS.
 * Úsalo en producción si no tienes acceso a Edge Functions.
 * 
 * Instalación:
 *   npm install express cors
 * 
 * Ejecución:
 *   npm run proxy
 *   o
 *   node proxy-server.js
 * 
 * El servidor correrá en http://localhost:3001
 * Configura tu servidor web (nginx, etc.) para hacer proxy a este puerto.
 */

import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

const RENIEC_API_URL = "https://api.factiliza.com/v1/dni/info";
// Obtener la clave de API de las variables de entorno o usar una constante
// Para usar: export FACTILIZA_API_KEY=tu_clave_aqui antes de ejecutar el servidor
const FACTILIZA_API_KEY = process.env.FACTILIZA_API_KEY || "";

// Habilitar CORS para todas las rutas
app.use(cors({
  origin: '*', // En producción, especifica tu dominio
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
}));

// Middleware para parsear JSON
app.use(express.json());

// Ruta de salud
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Proxy server is running' });
});

// Ruta principal para consultar DNI
app.get('/api/reniec', async (req, res) => {
  try {
    const dni = req.query.numero;

    if (!dni) {
      return res.status(400).json({
        success: false,
        error: "El parámetro 'numero' (DNI) es requerido",
      });
    }

    if (dni.length !== 8) {
      return res.status(400).json({
        success: false,
        error: "El DNI debe tener 8 dígitos",
      });
    }

    // Preparar headers con autenticación si está disponible
    const headers = {
      "Content-Type": "application/json",
      "Accept": "application/json",
    };
    
    // Agregar autenticación si hay una clave de API
    if (FACTILIZA_API_KEY) {
      // Intentar con Authorization Bearer primero
      headers["Authorization"] = `Bearer ${FACTILIZA_API_KEY}`;
      // También intentar con X-API-Key como alternativa
      headers["X-API-Key"] = FACTILIZA_API_KEY;
    }
    
    // Hacer la petición a la API de RENIEC
    const response = await fetch(`${RENIEC_API_URL}/${dni}`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      let errorMessage = `Error ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        // Si no se puede parsear el error, usar el mensaje por defecto
      }

      return res.status(response.status).json({
        success: false,
        error: errorMessage,
        message: "Error al consultar el DNI en RENIEC",
      });
    }

    let responseData;
    try {
      responseData = await response.json();
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: "Error al procesar la respuesta de RENIEC",
        message: "La respuesta no es un JSON válido",
      });
    }

    // La API puede devolver los datos directamente o dentro de un objeto 'data'
    const data = responseData.data || responseData;

    // Validar que tenemos los datos mínimos
    if (!data || (!data.nombres && !data.nombre) || (!data.apellidoPaterno && !data.apellido_paterno)) {
      return res.status(400).json({
        success: false,
        error: "Datos incompletos del DNI",
        message: "No se pudieron obtener todos los datos necesarios de RENIEC",
      });
    }

    // Normalizar los nombres de campos
    const normalizedData = {
      numero: data.numero || dni,
      nombres: data.nombres || data.nombre || "",
      apellidoPaterno: data.apellidoPaterno || data.apellido_paterno || "",
      apellidoMaterno: data.apellidoMaterno || data.apellido_materno || "",
      codVerifica: data.codVerifica || data.cod_verifica,
      fechaNacimiento: data.fechaNacimiento || data.fecha_nacimiento || data.fechaNac,
      sexo: data.sexo || data.genero,
      estadoCivil: data.estadoCivil || data.estado_civil,
      direccion: data.direccion || data.direccion_completa,
      ubigeo: data.ubigeo,
      distrito: data.distrito,
      provincia: data.provincia,
      departamento: data.departamento,
      foto: data.foto || data.photo_url || data.foto_url,
    };

    res.json({
      success: true,
      data: normalizedData,
    });
  } catch (error) {
    console.error("Error en proxy:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
      message: "Error al conectar con el servicio de RENIEC",
    });
  }
});

// Manejar OPTIONS para CORS preflight
app.options('/api/reniec', (req, res) => {
  res.sendStatus(204);
});

app.listen(PORT, () => {
  console.log(`🚀 Proxy server running on http://localhost:${PORT}`);
  console.log(`📡 Proxying requests to: ${RENIEC_API_URL}`);
  console.log(`\nPara usar en producción, configura tu servidor web para hacer proxy a este puerto.`);
});


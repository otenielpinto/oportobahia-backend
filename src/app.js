import "express-async-errors";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import os from "os";
//aqui poderia importar o types se estiver usando typeScript para mappers

dotenv.config();
process.env.TZ = "America/Sao_Paulo";
const app = express();

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors({ origin: process.env.CORS_ORIGIN }));

//Minhas rotas igual eu faço com o horse
app.get("/health", (req, res) => {
  const healthCheck = {
    status: "UP",
    database: null, // await checkDatabaseConnection() Função que verifica o status do banco de dados
    responseTime: Date.now() - req.startTime,
    version: "1.0.3",
    memoryUsage: {
      total: os.totalmem(),
      used: os.totalmem() - os.freemem(),
    },
    externalService: null, // await checkExternalService()Função que verifica dependências externas
    uptime: process.uptime(),
    date: new Date().toISOString(),
  };
  res.status(200).json(healthCheck);
});

export default app;

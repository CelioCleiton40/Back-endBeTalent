import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import swaggerDocs from "./config/swagger"; // Agora, importando o documento já gerado
import paymentRoutes from "./routes/paymentRoutes";

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

// Configurar as rotas da API
app.use("/payments", paymentRoutes);

// Configurar Swagger
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

export default app;

import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";
import { env } from "./dotenv";

// Objeto de configuração do Swagger
const swaggerConfig = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Payment Gateway API",
            version: "1.0.0",
            description: "API for processing payments through multiple payment gateways",
            contact: {
                name: "API Support",
                email: "support@example.com",
            },
        },
        servers: [
            {
                url: `http://localhost:${env.server.port}`,
                description: "Development server",
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
            schemas: {
                Payment: {
                    type: "object",
                    properties: {
                        amount: { type: "number" },
                        currency: { type: "string" },
                        orderId: { type: "string" },
                        gatewayName: { type: "string" },
                    },
                    required: ["amount", "currency", "orderId"],
                },
                Order: {
                    type: "object",
                    properties: {
                        customerId: { type: "string" },
                        customerEmail: { type: "string" },
                        totalAmount: { type: "number" },
                        currency: { type: "string" },
                        items: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    id: { type: "string" },
                                    name: { type: "string" },
                                    quantity: { type: "number" },
                                    unitPrice: { type: "number" },
                                },
                            },
                        },
                    },
                    required: ["customerId", "customerEmail", "totalAmount", "currency", "items"],
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
        tags: [
            {
                name: "Payments",
                description: "Payment processing endpoints",
            },
            {
                name: "Orders",
                description: "Order management endpoints",
            },
        ],
    },
    apis: ["./src/routes/*.ts"],
};

// ✅ Criando a documentação corretamente
const swaggerDocs = swaggerJSDoc(swaggerConfig);

export default swaggerDocs;

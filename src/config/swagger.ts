import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Enterprise SaaS API",
      version: "1.0.0",
      description: "API documentation for the Node.js Boilerplate",
    },
    servers: [
      {
        url: "http://localhost:8000/api/v1",
        description: "Local Development Server",
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
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  // Look for comments in these files
  apis: ["./src/modules/**/*.routes.ts", "./src/modules/**/*.controller.ts"], 
};

export const swaggerSpec = swaggerJsdoc(options);
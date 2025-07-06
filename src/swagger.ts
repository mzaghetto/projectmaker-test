import swaggerJsdoc from 'swagger-jsdoc';
import * as dotenv from 'dotenv';
dotenv.config();

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Knowledge Base API',
      version: '1.0.0',
      description: 'A RESTful API for a Dynamic Knowledge Base System',
    },
    servers: [
      {
        url: process.env.SWAGGER_SERVER_URL || 'http://localhost:3000/api',
      },
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-user-id',
        },
      },
    },
    security: [
      {
        ApiKeyAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/models/*.ts'],
};

const specs = swaggerJsdoc(options);

export default specs;
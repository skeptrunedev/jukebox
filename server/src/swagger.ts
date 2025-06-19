import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import type { Express } from 'express';

// OpenAPI definition options
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Boxes & Songs API',
      version: '1.0.0',
      description: 'Automatically generated OpenAPI spec for Boxes & Songs',
    },
  },
  apis: ['src/index.ts'],
};

const specs = swaggerJsdoc(options);

/**
 * Mounts Swagger UI at /api-docs and serves OpenAPI JSON at /openapi.json
 */
export function setupSwagger(app: Express) {
  app.use('/api-docs', ...swaggerUi.serve, swaggerUi.setup(specs));
  app.get('/openapi.json', (_req, res) => {
    res.json(specs);
  });
}
import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'CRM API',
      version: '1.0.0',
      description: 'REST API for repository tracking CRM with AI-powered analysis',
    },
    servers: [{ url: '/api', description: 'API base path' }],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
        Project: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            owner: { type: 'string', example: 'facebook' },
            name: { type: 'string', example: 'react' },
            url: { type: 'string', example: 'https://github.com/facebook/react' },
            stars: { type: 'integer' },
            forks: { type: 'integer' },
            issues: { type: 'integer' },
            createdAt: { type: 'integer', description: 'Unix timestamp' },
          },
        },
        Settings: {
          type: 'object',
          properties: {
            aiProvider: { type: 'string', example: 'openai' },
            aiApiKey: { type: 'string', nullable: true, example: '****abcd' },
            aiModel: { type: 'string', nullable: true, example: 'gpt-4o-mini' },
            aiBaseUrl: { type: 'string', nullable: true },
            hideIntro: { type: 'boolean' },
          },
        },
        AiSummary: {
          type: 'object',
          properties: {
            summary: { type: 'string' },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);

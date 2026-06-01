const swaggerJSDoc = require('swagger-jsdoc');
const path = require('path');
const env = require('../config/env');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'GitHub Profile Analyzer API',
      version: '1.0.0',
      description: 'API to fetch GitHub user profiles, analyze languages, repositories, and star counts, and cache insights in MySQL.',
    },
    servers: [
      {
        url: "/",
        description: 'Current server',
      },
    ],
  },
  apis: [
    path.join(__dirname, '../routes/*.js').replace(/\\/g, '/'),
  ],
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;

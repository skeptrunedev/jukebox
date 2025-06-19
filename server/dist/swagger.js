"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSwagger = setupSwagger;
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
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
const specs = (0, swagger_jsdoc_1.default)(options);
/**
 * Mounts Swagger UI at /api-docs and serves OpenAPI JSON at /openapi.json
 */
function setupSwagger(app) {
    app.use('/api-docs', ...swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(specs));
    app.get('/openapi.json', (_req, res) => {
        res.json(specs);
    });
}

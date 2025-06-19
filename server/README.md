# Jukebox Server

This server provides a REST API for managing boxes, songs, and their relationships.

## OpenAPI & SDK Generation

The server now publishes an OpenAPI spec and Swagger UI. You can generate a TypeScript SDK for the React frontend using the provided script.

1. Start the server:
   ```bash
   yarn dev
   # or: yarn start
   ```

2. In another terminal, run:
   ```bash
   yarn generate:sdk
   ```

This will fetch the OpenAPI schema at `http://localhost:3001/openapi.json` and generate a typed client in your frontend project at:

```
../frontend/src/sdk/api.ts
```

You can then import and use the client in your React app:
```ts
import ApiClient, { paths } from './sdk/api';

const client = new ApiClient({ baseUrl: 'http://localhost:3001' });
// Example: GET /api/boxes
const response = await client.get(paths['/api/boxes'].get);
``` 
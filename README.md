# WebsiteMapper

WebsiteMapper is a web crawler and simple SEO analysis tool. It consists of a TypeScript
Express server and a React client built with Vite. The server exposes a small REST API for
starting a crawl, monitoring progress and exporting results. All crawl data is stored in
memory by default.

## Features

- Crawl pages of a website and track status codes, content types, load time and depth
- View progress in real time in the React client
- Stop an active crawl
- Export results to CSV

## Project Structure

```
/attached_assets       Static assets used by the client
/client                React front‑end application
/server                Express server and crawl logic
/shared                Database and API schemas
```

The client is served through Vite during development and from `dist/public` in production.
The server listens on **port 5000** and serves both the API and the built client.

## Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Run in development**
   ```bash
   npm run dev
   ```
   The application will be available at [http://localhost:5000](http://localhost:5000).
3. **Build for production**
   ```bash
   npm run build
   npm start
   ```

A PostgreSQL database is optional and not required by default—the included storage
implementation keeps crawl data in memory. A `drizzle.config.ts` file exists for generating
migrations should you wish to persist crawl sessions in a database.

## Scripts

- `npm run dev` – start the Express server with Vite in middleware mode
- `npm run build` – bundle the client and server into `dist/`
- `npm start` – run the production build
- `npm run check` – type‑check the project with `tsc`

## License

This project is licensed under the MIT License.

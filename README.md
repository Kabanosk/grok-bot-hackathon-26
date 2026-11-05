# Hackathon projects

An npm-workspace monorepo for the Grok hackathon. Each product lives in its own top-level directory.

## Cohort

[Cohort](./cohort) is a product research concept: test a product decision with a swarm of AI customers, informed by human research.

```sh
npm ci
npm run dev
```

Open **http://127.0.0.1:5173/**. Node.js 22.12+ or 24+ is recommended.

```sh
npm run build
npm run typecheck
npx playwright install chromium
npm run test:e2e
```

The current app is an interactive frontend demo. It does not call Grok, visit submitted URLs, or use real customer data. See [the product README](./cohort/README.md) for scope and design decisions.

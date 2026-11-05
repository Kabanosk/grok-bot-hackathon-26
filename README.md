# Hackathon projects

An npm-workspace monorepo. Each product lives in its own top-level directory.

## Cohort

[Cohort](./cohort) is a customer-research workspace with population exploration, surveys, focus groups, pricing, A/B research and calibration.

```sh
npm ci
npm run dev
```

Open **http://127.0.0.1:5173/workspace** and choose **Enter demo workspace**. Sign-in is mocked; no password or real account is required. The default synthetic sandbox works without external credentials.

```sh
npm run build
```

Node.js 22.12+ or 24+ is recommended. Native Grok Bot integration is optional and requires a configured webhook routine plus an HTTPS callback origin. See [the product README](./cohort/README.md).

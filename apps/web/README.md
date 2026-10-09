# @kinsign/web

The site, the documentation, the benchmarks page and the two-phone demo, in React, Vite, Tailwind and motion.

```
src/
├── app/                 Router, layouts (root, site), language provider
├── components/
│   ├── ui/              Design system: ArrowButton, NavPill, Sheet, Toast, Badge, Switch, LogoMark
│   ├── site/            Header, footer, logo, container, site-wide links
│   ├── motion/          Reveal: transform-only entrances
│   ├── code/            Highlighted code block shared by the landing and the docs
│   └── device/          iPhone frame with status bar and dynamic island
├── features/
│   ├── landing/         Sections and copy (content.ts)
│   ├── docs/            Docs shell, Markdown renderer, sidebar, table of contents, search
│   ├── benchmarks/      Results read from bench/results/*.json at build time
│   ├── phone/           Mum's phone: usePhoneSession and presentational components
│   ├── family/          The trusted person's phone: useFamily and components
│   ├── director/        Scenario, call and bank-side controls
│   └── stage/           Both devices side by side
├── i18n/                Locales for the demo (en, zh, id)
└── lib/                 API client, device keys, signer hook, polling and visibility hooks
```

- **Docs come from the repository.** `features/docs/content` reads `docs/**/*.md` through the `@docs` alias, and `test/docs.test.ts` checks the sidebar against the files and every internal link.
- **State lives in hooks**, and components render. Derived state is computed during render.
- **Motion never decides what is visible.** Entrances move only transform, and run only while the page is visible (`usePageVisible`), because browsers stop animation frames in hidden pages.

`npm run dev` starts it on :5190 and proxies `/api` and `/rpc` to the bank API on :8620.

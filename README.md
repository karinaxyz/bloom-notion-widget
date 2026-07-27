# Bloom

Bloom is a lightweight embeddable Notion widget. It stores a small daily task list in `localStorage` and restores a botanical illustration as tasks are completed.

## MVP Features

- Add, edit, remove, check, and uncheck tasks
- Reset the list
- No backend, auth, notifications, or database
- Progress is calculated as `completedTasks / totalTasks`
- Botanical progress states live in `public/bloom-states`

## Progression

Artwork is selected from a single ordered state array:

1. `bloom-0-of-5.png`
2. `bloom-1-of-5.png`
3. `bloom-2-of-5.png`
4. `bloom-3-of-5.png`
5. `bloom-4-of-5.png`
6. `bloom-full.png`

No tasks and 100% complete both show `bloom-full.png`. Active progress is calculated as `completedTasks / totalTasks`, then mapped across the restoring states so the artwork advances proportionally no matter how many tasks are on the list.

## Run Locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Deploy To GitHub Pages

1. Push this project to a GitHub repository.
2. Run `npm run build`.
3. Publish the `dist` directory with GitHub Pages, or use a Pages workflow that builds the project and uploads `dist`.
4. Paste the Pages URL into Notion and choose **Create embed**.

The Vite config uses `base: './'` so the static build works from a GitHub Pages project subpath.

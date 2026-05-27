# Bloom

Bloom is a lightweight embeddable Notion widget. It stores a small daily task list in `localStorage` and restores a botanical illustration as tasks are completed.

## MVP Features

- Add, edit, remove, check, and uncheck tasks
- Reset the list
- No backend, auth, notifications, or database
- Progress is calculated as `completedTasks / totalTasks`
- Botanical stages live in `public/botanical`

## Progression

- No tasks: `07`
- Tasks exist + 0% complete: `00`
- >0% and <=20%: `02`
- >20% and <=40%: `04`
- >40% and <=60%: `05`
- >60% and <100%: `06`
- 100% complete: `07`

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

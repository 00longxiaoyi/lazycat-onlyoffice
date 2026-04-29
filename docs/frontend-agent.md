# Frontend Agent Guidelines

## CSS Organization

Frontend CSS must not be accumulated in one large global file.

Rules:

- Split styles by responsibility and page/component domain.
- Keep a small import entry such as `styles/index.css` only for ordering CSS modules.
- Put shared reset, layout, page-specific, and component-specific styles in separate files.
- When adding a new frontend page or sizeable component, add or reuse a matching CSS module instead of appending everything to one file.

Current CSS module layout:

- `app/frontend/src/styles/base.css`: reset, global document shell, legacy page shell basics.
- `app/frontend/src/styles/layout.css`: home layout, sidebar, shared panels, home tabs.
- `app/frontend/src/styles/drive.css`: Lazycat drive toolbar, table, file icons, shared drive errors.
- `app/frontend/src/styles/favorites.css`: favorites page and favorite star controls.
- `app/frontend/src/styles/recent.css`: recent files panel.
- `app/frontend/src/styles/fonts.css`: font management page and dialogs.
- `app/frontend/src/styles/online-url.css`: online URL page.
- `app/frontend/src/styles/settings.css`: shared settings/module buttons and danger buttons.
- `app/frontend/src/styles/editor.css`: editor/open page states.
- `app/frontend/src/styles/responsive.css`: narrow window and mobile adaptations.

## Layout Design

Frontend pages must be full-area application screens, not small floating modules.

Rules:

- Prefer layouts that fill the available content area.
- Avoid designing isolated small cards centered inside large empty pages unless the feature is explicitly a modal, dialog, or confirmation overlay.
- Main pages such as Home, Favorites, Online URL, and Font Management should visually occupy the right-side workspace consistently.
- Empty states should live inside the full page/panel area rather than creating a small standalone block.

## Typography

Use a small, explicit font scale. Do not shrink normal readable text below 16px.

Current levels:

- `--font-size-micro: 10px`: exceptional metadata only, such as long file paths under recent-file titles.
- `--font-size-meta: 14px`: secondary metadata, hints, subtitles, log text, compact paths, and non-primary descriptions.
- `--font-size-base: 16px`: default readable text, table rows, navigation labels, forms, buttons, empty states, and errors.
- `--font-size-title: 18px`: panel titles, dialog titles, and section labels.
- `--font-size-display: 28px`: rare large page titles such as the online URL landing title.

Rules:

- Use `16px` as the minimum size for primary text, table rows, navigation labels, forms, buttons, empty states, and errors.
- Text below `16px` must be reserved for non-essential metadata and must have a clear reason.
- File paths are allowed to use `10px` only when they are secondary context under a primary title.
- If a page feels dense, adjust spacing, columns, truncation, or layout before shrinking primary text below `16px`.
- Centralize font-size overrides in `app/frontend/src/styles/typography.css` where practical.

## Visual Tone

The product should remain calm, flat, office-product-like, and practical.

Rules:

- Avoid flashy marketing-style layouts.
- Avoid hero sections, explanatory marketing blocks, and decorative small feature cards.
- Prioritize dense, clear productivity UI similar to document/file management products.

## Frontend Boundary Rules From Review

These rules capture concrete frontend mistakes found during implementation and must be checked before future UI changes are considered done.

### Full-Workspace Layout Boundary

- Main application pages must use the full available workspace; do not place small standalone modules inside large empty areas.
- White page/workspace backgrounds should visually fill the application area unless a specific panel, dialog, or overlay requires a separated surface.
- Avoid unnecessary outer cards, borders, or rounded wrappers around full-page work areas.
- Empty states must stay within the same full-page structure as populated states, not become centered mini cards.

### Visual Hierarchy Boundary

- Do not add redundant page titles when the navigation already establishes the current page context.
- Prefer concise counters such as `共 X 条记录` / `共 X 条收藏记录` over repeated section titles.
- Toolbars, counters, status messages, and lists must have clear priority and spacing; status text should not crowd list content.
- Conflict, warning, and confirmation states should have enough padding and clear grouping; avoid cramped inline warning blocks.

### Typography Boundary

- Primary readable text remains `16px` unless the component is explicitly compact.
- Filter buttons in the home file toolbar must stay `14px`; do not shrink them to fit layout.
- Secondary paths and metadata may use `12px` or `14px`; avoid `10px` except for exceptional, low-priority metadata.
- If content feels crowded, fix layout, width, wrapping, or truncation before reducing font size.

### Icon Boundary

- SVG icons from `app/frontend/src/icon` must be rendered as inline SVG via `SvgIcon` and `*.svg?raw`, not as `<img>` assets.
- Icon sizes must be controlled by CSS on the icon wrapper; avoid `object-fit` and image-specific rules for SVG icons.
- Navigation icons, list icons, toolbar icons, and destructive icons must have explicit size rules and vertical alignment with text.
- Use the same icon semantics consistently: file type icons identify file type, star icons identify favorite state, and `×` is preferred for per-row removal when requested.

### List And Row Boundary

- Similar list pages must share visual language: row spacing, hover state, icon alignment, metadata style, and empty state behavior should match.
- Do not duplicate information already represented by icons, such as showing a type column when the file/folder icon already communicates it.
- Rows with actions must keep click targets and action buttons visually separated; action buttons must not break row alignment.
- Long names and paths must use truncation and should not push actions or columns out of view.

### Toolbar And Filter Boundary

- Toolbars must be stable under long paths and narrow widths; use grid/flex constraints instead of allowing one area to crush another.
- Long paths must truncate inside their own area and must not wrap or push filter buttons off layout.
- Filter selected states should use the same calm gray visual tone as hover unless a stronger state is explicitly required.
- Selected filter content must be horizontally and vertically centered.

### Dialog And Confirmation Boundary

- All second-level confirmations must use the shared confirmation dialog component instead of `window.confirm`.
- Dialog buttons must have consistent height, width, alignment, and typography.
- Destructive actions should use consistent danger styling, while cancellation remains neutral.
- Dialog copy should be short and specific, e.g. `此文件已被占用` instead of long ambiguous messages.

### CSS Maintenance Boundary

- Do not keep appending conflicting overrides to the end of CSS files as the normal solution.
- When a style changes, remove or consolidate obsolete rules in the same module.
- Avoid duplicate selector definitions with contradictory values unless the later rule is an intentional responsive override.
- If a style requires `!important`, document why or refactor the selector order so future changes remain predictable.

### Component Structure Boundary

- Page components should own page composition and routing state, not all detailed UI and interaction implementation.
- Reusable UI pieces such as sidebars, toolbars, list rows, icon buttons, empty states, status messages, dialogs, and panels should be split into focused components.
- Large page modules such as font management, online URL opening, recent files, favorites, and drive browsing should live in their own page/panel components instead of accumulating inside `HomePage.tsx`.
- Shared behavior should be extracted into hooks when it is reused or makes a page component difficult to scan.
- Component boundaries should follow visual and responsibility boundaries; do not split purely for file count, and do not keep unrelated UI in one component for convenience.

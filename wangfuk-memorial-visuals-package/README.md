# Wang Fuk Memorial Visuals

This folder contains the standalone files for the memorial visualization page.

## Preview

Run a local static server from this folder:

```bash
python3 -m http.server 8772
```

Then open:

```text
http://localhost:8772/wangfuk-memorial-visuals.html
```

## Main Files

- `wangfuk-memorial-visuals.html`: the page entry.
- `wangfuk-memorial-visuals.css`: page-specific visualization styles.
- `wangfuk-memorial-visuals.js`: D3 rendering and interaction logic.
- `styles.css`: shared story-page visual system.
- `d3.min.js`: local D3 dependency.
- `assets/`: local images used by the page styles.
- `outputs/datasets/`: CSV/XLSX datasets used for the soundwall and lampwall.

## Data Sources

The datasets were整理 from public pages on `wangfukcourtfire.webflow.io`:

- Messages: `https://wangfukcourtfire.webflow.io/viewmessages`
- Souls: `https://wangfukcourtfire.webflow.io/168souls`

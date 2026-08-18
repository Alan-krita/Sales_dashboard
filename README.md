# VOYX Ultra | Real-Time Sales & Analytics Dashboard

A modern, high-performance web dashboard featuring dark glassmorphism styling, real-time Supabase REST API integration, daily sales leaderboard analytics, wallet summaries, and interactive data visualization.

![VOYX Ultra Sales Dashboard Banner](https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&auto=format&fit=crop&q=80)

## Features

- **Live Database Stream**: Seamlessly connects to Supabase REST API for live order records with fallback to demo mode.
- **Daily Leaderboard**: Displays performance metrics (`#DAY`, `#MTD`, `MTD REV`, `ARPU`, `TARGET %`, `#PV_MONTH`) for all sales representatives mapped to human user names.
- **Interactive Modals & Controls**:
  - **API Config**: Dynamic configuration modal to test and save Supabase Project URL, Anon Public Key, and Table Name.
  - **Log Out**: Secure logout confirmation modal and session reset workflow.
  - **June 2026 Month Picker**: Interactive date range selector dropdown to filter performance metrics across months.
- **Wallet Summary & Revenue Breakdown**: Comprehensive financial metrics, rep discount analysis, net revenue, and Chart.js bar visualizations.
- **Responsive Layout**: Full glassmorphism design with mobile drawer support and sidebar collapse toggle.

## Project File Structure

```
Sales_dashboard/
├── index.html           # Main HTML layout entrypoint
├── css/
│   └── style.css        # Glassmorphism design tokens & styles
├── js/
│   └── app.js           # Core application logic & API connection
├── .gitignore           # Git ignore rules for clean repository state
└── README.md            # Comprehensive documentation
```

## How to Push to GitHub

To push your repository to GitHub, follow these step-by-step shell commands:

1. **Initialize Git repository**:
   ```bash
   git init
   ```

2. **Stage all files**:
   ```bash
   git add .
   ```

3. **Create initial commit**:
   ```bash
   git commit -m "feat: initial commit of VOYX Ultra Sales Dashboard with Supabase API integration"
   ```

4. **Link remote GitHub repository**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
   ```

5. **Push code to GitHub**:
   ```bash
   git branch -M main
   git push -u origin main
   ```

## Local Setup

Simply open `index.html` in any web browser, or launch a local dev server (e.g. `npx serve .` or VS Code Live Server).

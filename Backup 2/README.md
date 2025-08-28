# Marketing KPI Tracker

A comprehensive marketing performance tracking dashboard built with React, TypeScript, and Tailwind CSS. Features advanced analytics, annual performance reports, and comprehensive KPI management.

## Features

- **Dashboard**: Real-time performance metrics and analytics
- **Member Management**: Add and manage team members with different roles
- **Performance Tracking**: Track KPIs across multiple metrics
- **Target Management**: Set and manage role-based KPI targets
- **Reports**: Generate comprehensive performance reports
- **Annual Reports**: Generate detailed annual performance reviews with PDF export
- **Action Items**: AI-powered recommendations based on performance data
- **Authentication**: Secure login system
- **Mock Data**: Comprehensive sample data for demonstration

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Charts**: Chart.js with React Chart.js 2
- **Icons**: Lucide React
- **Build Tool**: Vite
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd marketing-kpi-tracker
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:5173](http://localhost:5173) in your browser.

## Login Credentials

- **Email**: `vijay@edstellar.com`
- **Password**: `Edstellar@2025`

## Annual Performance Reports

The system includes a comprehensive annual report generator that creates detailed performance reviews:

- **Executive Summary**: Overall performance grade and key metrics
- **KPI Analysis**: Detailed breakdown of all performance indicators
- **Strengths & Achievements**: Data-driven identification of top performance areas
- **Development Opportunities**: Areas for improvement with specific recommendations
- **Strategic Recommendations**: Actionable insights for the next performance period
- **Monthly Trends**: Complete performance history with visual analytics
- **PDF Export**: Professional reports ready for HR documentation

View the sample report in the Annual Reports section to see the full capabilities.

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Connect your GitHub repository to Vercel
3. Deploy with default settings

The application includes comprehensive fallback systems:
- **Mock Data**: Full dataset for demonstration without database
- **Fallback Authentication**: Works without external auth services
- **Production Ready**: Optimized build with caching and security headers
- **Responsive Design**: Works perfectly on all devices
- **Performance Optimized**: Fast loading with code splitting

## Project Structure

```
src/
├── components/          # React components
├── hooks/              # Custom React hooks
├── services/           # API services
├── utils/              # Utility functions
├── data/               # Mock data and samples
└── lib/                # Library configurations
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run deploy` - Deploy to Vercel

## License

This project is proprietary software.
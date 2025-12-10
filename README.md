# GoPlan - Academic Degree Planner

GoPlan is an AI-powered academic degree planning tool designed for Al Akhawayn University students. It helps students visualize their academic path, plan future courses, and get advisor approval for their plans.

## Features

- **Degree Planning**: Visual semester-by-semester course planner
- **AI Assistant**: Get AI-powered course recommendations and degree completion advice  
- **Transcript Integration**: View completed courses and track progress toward degree requirements
- **Advisor Approval Workflow**: Submit plans to advisors for review and approval
- **Prerequisite Tracking**: Automatic validation of course prerequisites
- **Recommended Courses**: Smart suggestions based on degree requirements and prerequisites

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: MySQL
- **AI**: Google Gemini API
- **UI Components**: shadcn/ui

## Getting Started

### Prerequisites

- Node.js 18+
- MySQL 8.0+
- Google Gemini API key

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env.local` and configure:
   ```
   DATABASE_URL=mysql://user:password@localhost:3306/goplan
   GEMINI_API_KEY=your-gemini-api-key
   JWT_SECRET=your-jwt-secret
   ```

4. Initialize the database:
   ```bash
   mysql -u root -p < database/schema.sql
   mysql -u root -p goplan < database/population.sql
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

## Demo Accounts

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | Password123! |
| Advisor | advisor_sse | Password123! |
| CS Senior | cs_senior_omar | Password123! |
| CS Freshman | cs_freshman_ismail | Password123! |

## Project Structure

```
src/
├── app/                    # Next.js app router
│   ├── (external)/         # Public pages (landing, login)
│   ├── (main)/             # Protected dashboard pages
│   └── api/                # API routes
├── components/             # Reusable UI components
└── lib/                    # Utilities and services
    ├── auth/               # Authentication
    ├── db/                 # Database queries
    └── domain/             # Business logic

database/
├── schema.sql              # Database schema
├── population.sql          # Sample data (merged)
└── population/             # Individual population files
```

## License

MIT
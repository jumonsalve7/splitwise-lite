# SplitWise Lite — Group Expense Splitter & Debt Simplifier

A full-stack MERN (MongoDB, Express, React, Vite) web application for tracking shared group expenses, managing participants, computing real-time net balances, and simplifying peer-to-peer settlements. Built with a clean fintech-inspired UI and a one-click zero-state demo mode.

## Key Features

- **Authentication & One-Click Demo Mode**: JWT-based sign-up and sign-in alongside an instant demo account that starts with a clean slate (`0` groups) for immediate testing.
- **Full Group & Participant Management**:
  - Collapsible group creation form while keeping the creation trigger accessible.
  - Inline group renaming and a dark-backdrop confirmation modal for deleting groups.
  - Participant management panel to add, rename, or remove group members while automatically recalculating balances.
- **Expense Tracking & Split Selection**: Add expenses with custom payers and selectable participant pills for equal splits, paired with a collapsible expense history panel.
- **Real-Time Balances & Debt Simplification**: Automatically computes each member's net balance and generates minimal transfer suggestions to settle group debts.

## Tech Stack

- **Frontend**: React, Vite, Custom Design System (CSS variables, responsive grid & modal UI)
- **Backend**: Node.js, Express.js, JSON Web Tokens (`jsonwebtoken`), `bcryptjs`
- **Database**: MongoDB with Mongoose ODM

## Architecture

The project is organized into two decoupled packages (`backend` and `frontend`):

```text
split/
├── backend/
│   └── src/
│       ├── controllers/     # Auth and group/expense request handlers
│       ├── middleware/        # JWT route protection
│       ├── models/            # Mongoose schemas (User, Group, Expense)
│       ├── routes/            # Express route definitions
│       └── utils/             # Balance & settlement calculation, demo seed helper
└── frontend/
    └── src/
        ├── components/        # Authentication view and UI components
        ├── services/          # Centralized fetch API client
        ├── App.jsx            # Main dashboard state and group workflows
        └── index.css          # Theme tokens, layout, pills, and modal styles


Request & Data Flow

Auth Flow: Users authenticate via /api/auth/signup, /api/auth/signin, or /api/auth/demo. The client stores the returned JWT and user profile in localStorage and attaches Authorization: Bearer <token> on protected requests.

Group & Expense Mutations: Creating/renaming/deleting groups, updating members, or adding expenses hits authenticated /api/groups endpoints, persists changes in MongoDB, and returns updated balance and settlement summaries.

Debt Calculation Logic

Balances and settlement suggestions are computed on the backend in backend/src/utils/balanceCalculator.js:

Net Balance Calculation:Each member starts with a net balance of 0.For every expense of amount $A$ paid by paidBy and split equally among $N$ participants (splitBetween):paidBy is credited $+A$.Each participant in splitBetween is debited $-\frac{A}{N}$.

Greedy Debt Simplification:

Members with positive balances are treated as creditors (owed money) and members with negative balances as debtors (owe money).

Iteratively pairing the largest debtor with the largest creditor and transferring $\min(\text{debt}, \text{credit})$ reduces redundant back-and-forth payments and brings net balances toward zero.

API Endpoints

MethodEndpointAuthDescriptionPOST/api/auth/signupPublicRegister a new user and return a JWTPOST/api/auth/signinPublicSign in with email and passwordPOST/api/auth/demoPublicProvision/reset demo account with zero-state startupGET/api/groupsBearer JWTList groups owned by the authenticated userPOST/api/groupsBearer JWTCreate a new group with at least two membersGET/api/groups/:idBearer JWTFetch group details, balances, and settlementsPATCH/api/groups/:idBearer JWTRename a groupDELETE/api/groups/:idBearer JWTDelete a group and its expensesPATCH/api/groups/:id/membersBearer JWTAdd, rename, or remove group membersPOST/api/groups/:id/expensesBearer JWTAdd a new expense and recalculate balancesLocal Setup InstructionsPrerequisitesNode.js (v18+ recommended; v20+ or v24+ supported)MongoDB (local MongoDB instance or MongoDB Atlas connection URI)1. Clone the RepositoryBashgit clone <your-repository-url>
cd split
2. Configure & Start the BackendBashcd backend
npm install
Create a .env file inside backend/:Fragmento de códigoPORT=3001
MONGODB_URI=mongodb://127.0.0.1:27017/splitwise_lite
JWT_SECRET=replace_with_a_strong_secret_key
Start the development server:Bashnpm run dev
The API will run at http://localhost:3001.3. Configure & Start the FrontendOpen a second terminal in frontend/:Bashcd frontend
npm install
Create a .env file inside frontend/:Fragmento de códigoVITE_API_URL=http://localhost:3001/api
Start the Vite development server:Bashnpm run dev
Open the local URL shown by Vite (typically http://localhost:5173) in your browser.
<ElicitationsGroup message="Next steps for your portfolio:">
  <Elicitation label="Create a deployment checklist for this MERN app" query="Give me a clear checklist for preparing environment variables, GitHub repository structure, and live deployment for this MERN app."/>
  <Elicitation label="Add a Settle Up action to clear debts" query="Add a Settle Up button on suggested settlements so users can mark a debt transfer as settled and update balances."/>
</ElicitationsGroup>
```

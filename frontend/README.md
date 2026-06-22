# Airjet Frontend

This is the frontend application for the Airjet Aviation Management System.

## Features

- User management interface
- Real-time data fetching from backend API
- Responsive design with modern UI
- Integration with Airjet Backend API

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Airjet Backend API running on port 5000

## Installation

```bash
npm install
```

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

## Project Structure

- `src/App.js` - Main application component
- `src/App.css` - Application styles
- `src/index.js` - Application entry point
- `public/` - Static assets

## Technologies

- React 19
- Axios for API calls
- Bootstrap 5 for styling
- React Icons

## API Integration

The frontend connects to the backend API at:
- Base URL: `http://localhost:5000/api`
- Endpoints:
  - GET `/users` - Fetch all users
  - GET `/users/:id` - Fetch user by ID
  - POST `/users` - Create new user
  - PUT `/users/:id` - Update user
  - DELETE `/users/:id` - Delete user

## Environment Setup

Make sure the backend is running before starting the frontend:
1. Navigate to the backend directory
2. Run `npm start`
3. Navigate back to frontend directory
4. Run `npm start`

## License

MIT

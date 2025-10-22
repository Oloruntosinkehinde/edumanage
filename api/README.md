# Tophill Portal API

This is the REST API backend for the Tophill Portal application. It provides endpoints for managing students, teachers, subjects, results, and payments.

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MySQL database
- XAMPP (for local development)

### Installation

1. Clone the repository
2. Navigate to the api folder
3. Install dependencies

```bash
cd api
npm install
```

4. Create `.env` file based on `.env.example`
5. Set up the database schema (see below)
6. Start the server

```bash
npm run dev
```

## Database Setup

1. Create a database named `Tophill Portal` in your MySQL server
2. Import the database schema from `../php/schema/mysql-schema.sql`

## Available Scripts

- `npm start` - Start the server
- `npm run dev` - Start the server with nodemon for development
- `npm test` - Run tests
- `npm run lint` - Run linting

## API Endpoints

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh-token` - Refresh access token
- `POST /api/auth/forgot-password` - Forgot password
- `POST /api/auth/reset-password` - Reset password
- `POST /api/auth/logout` - User logout

### Users

- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get user by ID (admin only)
- `POST /api/users` - Create new user (admin only)
- `PUT /api/users/:id` - Update user (admin only)
- `DELETE /api/users/:id` - Delete user (admin only)
- `GET /api/users/profile` - Get authenticated user profile
- `PUT /api/users/profile` - Update authenticated user profile
- `PUT /api/users/change-password` - Change password

### Students

- `GET /api/students` - Get all students
- `GET /api/students/:id` - Get student by ID
- `POST /api/students` - Create new student (admin only)
- `PUT /api/students/:id` - Update student (admin only)
- `DELETE /api/students/:id` - Delete student (admin only)
- `GET /api/students/:id/results` - Get student results
- `GET /api/students/:id/payments` - Get student payments (admin only)
- `GET /api/students/:id/subjects` - Get student subjects

### Teachers

- `GET /api/teachers` - Get all teachers
- `GET /api/teachers/:id` - Get teacher by ID
- `POST /api/teachers` - Create new teacher (admin only)
- `PUT /api/teachers/:id` - Update teacher (admin only)
- `DELETE /api/teachers/:id` - Delete teacher (admin only)
- `GET /api/teachers/:id/subjects` - Get teacher subjects
- `POST /api/teachers/:id/subjects` - Assign subject to teacher (admin only)
- `DELETE /api/teachers/:id/subjects/:subjectId` - Remove subject from teacher (admin only)

### Subjects

- `GET /api/subjects` - Get all subjects
- `GET /api/subjects/:id` - Get subject by ID
- `POST /api/subjects` - Create new subject (admin only)
- `PUT /api/subjects/:id` - Update subject (admin only)
- `DELETE /api/subjects/:id` - Delete subject (admin only)
- `GET /api/subjects/:id/students` - Get subject students
- `GET /api/subjects/:id/teachers` - Get subject teachers

### Results

- `GET /api/results` - Get all results
- `GET /api/results/:id` - Get result by ID
- `POST /api/results` - Create new result (teacher only)
- `PUT /api/results/:id` - Update result (teacher only)
- `DELETE /api/results/:id` - Delete result (admin only)
- `GET /api/results/subject/:subjectId` - Get results by subject
- `GET /api/results/student/:studentId` - Get results by student
- `POST /api/results/bulk` - Bulk create results (teacher only)
- `POST /api/results/import` - Import results (admin only)
- `GET /api/results/export` - Export results (admin only)

### Payments

- `GET /api/payments` - Get all payments (admin only)
- `GET /api/payments/:id` - Get payment by ID (admin only)
- `POST /api/payments` - Create new payment (admin only)
- `PUT /api/payments/:id` - Update payment (admin only)
- `DELETE /api/payments/:id` - Delete payment (admin only)
- `GET /api/payments/student/:studentId` - Get payments by student
- `GET /api/payments/status/:status` - Get payments by status (admin only)
- `POST /api/payments/import` - Import payments (admin only)
- `GET /api/payments/export` - Export payments (admin only)
- `GET /api/payments/statistics` - Get payment statistics (admin only)

## Authentication

The API uses JWT (JSON Web Token) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

## Error Handling

All errors follow a standard format:

```json
{
  "error": {
    "message": "Error message",
    "code": "ERROR_CODE"
  }
}
```

## API Documentation

For detailed API documentation, visit `/api-docs` when the server is running.

## License

This project is licensed under the MIT License.
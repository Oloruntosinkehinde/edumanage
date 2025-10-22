# Copilot Instructions for Tophill Portal PHP Backend

## Project Overview
Tophill Portal is a modern PHP 8.3+ school management system. The codebase is structured as a RESTful API backend, with clear separation of concerns:
- **index.php**: Main API router, entry point for all HTTP requests. Handles CORS, preflight, and routes to controllers.
- **config/database.php**: Database connection logic. Supports both SQLite (default for development) and MySQL (set `use_sqlite` to false for production). Automatically initializes tables for SQLite.
- **models/**: Contains ORM-like classes for each entity (e.g., `User.php`). Models encapsulate CRUD and authentication logic, using prepared statements and password hashing.
- **utils/JWT.php**: Implements JWT encoding/decoding for authentication. Uses a hardcoded secret and HS256 algorithm.

## Key Patterns & Conventions
- **Routing**: All requests are routed through `index.php`, which loads controllers and models as needed. Controllers are required at the top; add new controllers here for new endpoints.
- **Authentication**: JWT-based. Tokens are generated and verified using `utils/JWT.php`. User authentication is handled in `models/User.php`.
- **Database**: Use `$database->getConnection()` to obtain a PDO instance. For development, SQLite is preferred; for production, switch to MySQL in `config/database.php`.
- **Models**: Each model receives a database connection in its constructor. Use prepared statements for all queries. Passwords are always hashed.
- **Error Handling**: Most errors are returned as JSON responses with appropriate HTTP status codes. Use `http_response_code()` and `echo json_encode()` for API responses.

## Developer Workflows
- **Run Locally**: Use PHP's built-in server for development:
  ```pwsh
  php -S localhost:8000
  ```
  The API will be available at `http://localhost:8000/index.php`.
- **Database Setup**: By default, SQLite DB is auto-created in `data/Tophill Portal.db`. For MySQL, update credentials in `config/database.php` and set `use_sqlite = false`.
- **Adding Endpoints**: Create a new controller in `controllers/`, require it in `index.php`, and add routing logic.
- **Testing**: Use tools like Postman or curl to test API endpoints. No built-in test suite is present.

## Integration Points
- **Frontend**: CORS is enabled for all origins. The backend is designed to be consumed by a separate frontend (e.g., React, Vue).
- **External Dependencies**: Only PDO (built-in) is used for DB access. No Composer dependencies.

## Examples
- **User Creation**: See `models/User.php:create($data)` for user registration logic.
- **JWT Usage**: See `utils/JWT.php` for token generation and verification.
- **Database Switching**: See `config/database.php` for toggling between SQLite and MySQL.

## File Reference
- `index.php`: API entry and router
- `config/database.php`: DB config and connection
- `models/`: Entity models
- `utils/JWT.php`: JWT auth

---
For questions or missing conventions, review the above files or ask for clarification. Update this file as new patterns emerge.

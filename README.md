📦 Express.js REST API

A simple RESTful API built with Express.js, implementing standard CRUD operations, middleware, error handling, and advanced features like filtering, pagination, and search.

🚀 Features

CRUD operations on products

Middleware:

Request logger

JSON body parsing

API key authentication

Input validation

Error handling with custom error classes

Advanced features:

Filtering products by category

Pagination

Search by name

Product statistics

📂 Project Setup
1. Clone the repo
git clone <your-repo-url>
cd <project-folder>

2. Install dependencies
npm install

3. Environment Variables

Create a .env file in the project root:

PORT=3000
API_KEY=2004Josh

▶️ Running the Server

Start the development server:

npm start


Server will run at:
👉 http://localhost:3000

📡 API Endpoints
Base URL
http://localhost:3000/api/products

Routes
Method	Endpoint	Description	Auth Required
GET	/api/products	Get all products (supports ?category, ?page, ?limit)	✅
GET	/api/products/:id	Get product by ID	✅
POST	/api/products	Create new product	✅
PUT	/api/products/:id	Update product by ID	✅
DELETE	/api/products/:id	Delete product by ID	✅
GET	/api/products/search?q=	Search product by name	✅
GET	/api/products/stats	Get product stats by category	✅
🔑 Authentication

All requests require an API key in the header:

x-api-key: 2004Josh

🧪 Testing

You can test using:

Postman

Insomnia

cURL

Example with cURL:

curl -H "x-api-key: 2004Josh" http://localhost:3000/api/products

⚠️ Error Handling

400 – Validation errors

401 – Unauthorized (missing/invalid API key)

404 – Resource not found

500 – Internal server error

📌 Tech Stack

Node.js

Express.js

dotenv

uuid

body-parser
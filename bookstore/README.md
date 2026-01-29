# 📚 Bookstore REST API (Go)

A RESTful Bookstore API built using **Go**, **Gorilla Mux**, **GORM**, and **MySQL**.  
This project demonstrates clean backend architecture, CRUD operations, and proper REST practices.

---

## 🚀 Features

- Create, Read, Update, Delete (CRUD) operations for books
- RESTful API design
- MySQL database integration using GORM
- Clean project structure (controllers, models, routes, config)
- Proper HTTP status codes and error handling

---

## 🛠 Tech Stack

- **Language:** Go
- **Router:** Gorilla Mux
- **ORM:** GORM
- **Database:** MySQL
- **Tools:** Postman, Git, Linux

---

## 📂 Project Structure

```text
bookstore/
├── cmd/
│   └── main/
│       └── main.go
├── pkg/
│   ├── config/
│   │   └── app.go
│   ├── controllers/
│   │   └── book-controller.go
│   ├── models/
│   │   └── book.go
│   ├── routes/
│   │   └── bookstore-routes.go
│   └── utils/
│       └── utils.go
├── go.mod
├── go.sum
└── README.md
```
---

## ⚙️ Database Setup

To run this project locally, make sure MySQL is installed and running on your system.  
Start the MySQL service and log in to the MySQL shell using:

```bash
sudo systemctl start mysql
sudo mysql
```

Once inside MySQL, create the required database and a dedicated user for the application:
```bash
CREATE DATABASE gorm;
CREATE USER 'bookuser'@'localhost' IDENTIFIED BY 'bookpass';
GRANT ALL PRIVILEGES ON gorm.* TO 'bookuser'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```
After creating the database and user, update the database connection string (DSN) in the configuration file located in pkg/config:

```bash
DSN: "bookuser:bookpass@tcp(localhost:3306)/gorm?charset=utf8&parseTime=True&loc=Local",
```

### 🧪 Sample Request (Postman)

To create a new book, send a POST request to `http://localhost:9010/books`
```bash
{
  "name": "Clean Code",
  "author": "Robert C. Martin",
  "publication": "Prentice Hall"
}
```
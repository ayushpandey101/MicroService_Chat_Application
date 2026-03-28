# 🚀 Microservice Chat Application

A highly scalable, real-time chat application built on a microservices architecture. Designed for performance and maintainability, this project divides core functionalities into independent, loosely coupled services (`User`, `Chat`, and `Mail`) that communicate asynchronously via message brokers and real-time WebSockets.

## ✨ Key Features

* **Real-Time Messaging:** Instant, low-latency text and media messaging powered by Socket.io.
* **Microservices Architecture:** Segregated domains for User management, Chat operations, and Mail delivery to ensure fault tolerance and independent scaling.
* **Event-Driven Asynchronous Tasks:** Utilizes RabbitMQ to decouple services, handling tasks like OTP generation and email notifications without blocking the main event loop.
* **Secure Authentication:** Robust user registration and login flow, including email-based OTP verification.
* **Media Sharing:** Seamless image and file uploading integrated with Cloudinary.
* **Modern UI:** A responsive, fast, and interactive frontend built with Next.js and Tailwind CSS.

## 🛠️ Tech Stack

### Frontend
* **Framework:** Next.js (App Router)
* **Library:** React
* **State Management:** React Context API
* **Styling:** Tailwind CSS

### Backend Services
* **Runtime & Framework:** Node.js, Express.js
* **Language:** TypeScript
* **Real-time Engine:** Socket.io
* **Database:** MongoDB & Mongoose
* **Message Broker:** RabbitMQ
* **Cloud Storage:** Cloudinary

## 🏗️ Architecture Overview

The application is split into three main backend services and one frontend application:

1. **User Service:** Manages user authentication, profile data, JWT token generation, and publishes events to the message broker.
2. **Chat Service:** Handles real-time Socket.io connections, message history, one-on-one/group chats, and media file uploads via Cloudinary.
3. **Mail Service:** A consumer service that listens to the message broker (RabbitMQ) for events and automatically dispatches transactional emails (e.g., OTPs, Welcome emails).

## 📂 Project Structure

```text
📦 MicroService_Chat_Application
 ┣ 📂 frontend         # Next.js React application
 ┗ 📂 backend
   ┣ 📂 user           # User & Authentication Service
   ┣ 📂 chat           # Real-time Chat & Media Service
   ┗ 📂 mail           # RabbitMQ Consumer for Emails
```

## 🚀 Getting Started

### Prerequisites
   Make sure you have the following installed on your machine:
  
  * **Node.js** (v16+)
  * **MongoDB** (Local or Atlas)
  * **RabbitMQ** (Local or Cloud instance)

### Installation
  1. **Clone the repository:**

  ```
  git clone [https://github.com/ayushpandey101/microservice_chat_application.git](https://github.com/ayushpandey101/microservice_chat_application.git)
  cd microservice_chat_application
```

  2. **Install dependencies for all services:**
  You will need to run npm install inside each respective directory:
  ```
  # Install Frontend dependencies
  cd frontend && npm install
 
  # Install Backend dependencies
  cd ../backend/user && npm install
  cd ../chat && npm install
  cd ../mail && npm install
  ```
  
  3. **Set up Environment Variables:**
     
      Create a .env file in each of the backend service folders (user, chat, mail) and the frontend folder. You will need variables for:
  
     * **PORT**
     * **MONGO_URI**
     * **RABBITMQ_URL**
     * **JWT_SECRET**
     * **Cloudinary Credentials** (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)
     * **Email** Credentials for the Mail Service (e.g., SMTP settings)

  5. Run the Application:
  Start each service in a separate terminal window:
  ```
  # Start User Service
  cd backend/user && npm run dev
  
  # Start Chat Service
  cd backend/chat && npm run dev

  # Start Mail Service
  cd backend/mail && npm run dev

  # Start Frontend
  cd frontend && npm run dev
  ```


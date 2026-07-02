# 🔗 LinkLens – Smart URL Shortener & Analytics Platform

## 📌 Project Overview

LinkLens is a full-stack URL shortening and analytics platform developed using React, Node.js, Express.js, and MongoDB Atlas. The application enables users to create, manage, and track shortened URLs through a secure and user-friendly dashboard.

The platform provides detailed analytics including click tracking, geolocation insights, device statistics, traffic sources, recent visit history, and link performance monitoring.

---

## 🚀 Features

### Authentication & Security

* User Registration and Login
* JWT-based Authentication
* Protected Dashboard Routes
* Secure Password Hashing
* User-specific URL Management

### URL Shortening

* Generate Unique Short URLs
* Custom Alias Support
* URL Validation
* Redirect to Original URL
* Link Expiry Date Management

### Dashboard Management

* View All Created Links
* Copy Short URLs
* Edit Existing Links
* Delete Links
* Search and Filter Links

### Analytics & Insights

* Total Click Tracking
* Click Trend Visualization
* Recent Visit History
* Geolocation Analytics
* Device Type Analytics
* Traffic Source Analytics
* Country-wise Statistics
* Link Performance Monitoring

### Additional Features

* QR Code Generation
* Bulk URL Creation via CSV Upload
* Export Analytics as CSV
* Export Analytics as PDF
* Public Statistics Page
* Dark Mode Support
* Responsive UI Design

---

## 🛠️ Tech Stack

### Frontend

* React.js
* Vite
* Tailwind CSS
* JavaScript

### Backend

* Node.js
* Express.js

### Database

* MongoDB Atlas
* Mongoose ODM

### Authentication

* JWT (JSON Web Tokens)
* bcrypt.js

---

## 🤖 AI Planning Document

### Problem Statement

Users often need a simple way to shorten long URLs and track link performance. Existing solutions provide limited customization and analytics.

### Proposed Solution

Build a secure URL shortening platform that allows authenticated users to:

* Create short links
* Manage URLs efficiently
* Monitor click analytics
* View geolocation and device insights
* Export reports
* Track link performance through a dashboard

### Development Workflow

1. Requirement Analysis
2. Feature Planning
3. Database Design
4. Backend API Development
5. Authentication Implementation
6. URL Shortening Logic
7. Analytics Tracking System
8. Dashboard UI Development
9. Testing & Validation
10. Documentation & Deployment Preparation

---

## 🏗️ Architecture Diagram

```text
┌─────────────────────┐
│      React UI       │
│  Dashboard & Auth   │
└──────────┬──────────┘
           │ REST APIs
           ▼
┌─────────────────────┐
│  Express Backend    │
│ Authentication API  │
│ URL Management API  │
│ Analytics API       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   MongoDB Atlas     │
│ Users Collection    │
│ Links Collection    │
│ Clicks Collection   │
└─────────────────────┘
```

---

## 📂 Project Structure

```text
LinkLens
│
├── frontend
│   ├── src
│   ├── public
│   └── package.json
│
├── backend
│   ├── src
│   ├── config
│   ├── controllers
│   ├── models
│   ├── middleware
│   └── package.json
│
└── README.md
```

---

## ⚙️ Setup Instructions

### Clone Repository

```bash
git clone <repository-url>
cd LinkLens
```

### Backend Setup

```bash
cd backend
npm install
```

Create `.env`

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

Run Backend

```bash
npm start
```

or

```bash
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Application URLs:

```text
Frontend: http://localhost:3000
Backend:  http://localhost:5000
```

---

## 📋 Assumptions Made

* MongoDB Atlas is used as the primary database.
* Users must be authenticated to manage URLs.
* Short codes are generated uniquely.
* Analytics are stored in the database.
* Internet access is available for geolocation tracking.
* Environment variables are configured correctly.

---

## 📊 Sample Outputs

### URL Shortening

**Original URL**

```text
https://www.google.com
```

**Generated Short URL**

```text
http://localhost:5000/4oAuRv9
```

---

### Dashboard Output

| Field        | Value        |
| ------------ | ------------ |
| Short Code   | 4oAuRv9      |
| Status       | Active       |
| Clicks       | 1            |
| Expiry       | Never        |
| Health Score | 40 - Average |

---

### Analytics Output

| Metric                | Value     |
| --------------------- | --------- |
| Total Links           | 1         |
| Total Clicks          | 1         |
| Average Clicks / Link | 1.0       |
| Geo Coverage          | 1 Country |
| Country               | India     |
| Device Type           | Desktop   |
| Traffic Source        | Direct    |

---

### Recent Visit Record

```text
Time: Jun 13, 20:18
Short URL: /4oAuRv9
Location: Mumbai, India
Device: Desktop
Referrer: Direct
```

---

### Database Records Stored

The application stores:

* User Information
* Shortened URLs
* Click Analytics
* Visit History
* Device Information
* Geolocation Data

in MongoDB Atlas collections.


---

## 🎥 Demo Video

Watch the complete project demonstration here:

https://youtu.be/YEffYYYkJIo?si=3me5z3GTKsHPbb6y

---

## 📸 Screenshots

### Dashboard
![Dashboard](screenshots/dashboard.png)

### Analytics
![Analytics](screenshots/analytics.png)

### Settings
![Settings](screenshots/settings.png)

### Create Link
![Create Link](screenshots/create-link.png)

---

## 🔮 Future Enhancements

* Custom Domains
* Advanced User Roles
* Team Collaboration
* Real-Time Analytics
* AI-based Traffic Prediction
* Mobile Application
* Cloud Deployment

---

## 👩‍💻 Developed By

**Dharshini S P**

B.Tech Information Technology (Final Year)

Dr. N.G.P. Institute of Technology

---

## 📄 License

This project is developed for educational and hackathon purposes.

---

### Hackathon Attribution

This project is a part of a hackathon run by https://katomaran.com

Test auto deploy
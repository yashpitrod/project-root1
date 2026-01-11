# 🏥 CampusCare – Smart Campus Dispensary Management System

**CampusCare** is a full-stack MERN-based web application designed to optimize campus healthcare services by reducing waiting times, improving doctor availability visibility, and enabling multilingual health request submission using AI-powered translation.

🚀 Built as a **prototype for hackathon & academic demonstration purposes**

---

## 🌐 Live Links

- **Frontend (Vercel):**  
  👉 https://campus-care-gules.vercel.app  

- **Backend (Render):**  
  👉 https://project-root1.onrender.com  

- **Prototype Demo Video (YouTube):**  
  🎥 https://www.youtube.com/watch?v=D6Y2koVobSc  

---

## 🧠 Problem Statement

In many college campuses, students frequently visit the dispensary for health concerns but face:

- Long waiting queues during peak hours  
- Limited doctor availability  
- No real-time visibility of dispensary status  
- Communication gaps between students and doctors  
- Language barriers in explaining health issues  

These challenges lead to **time wastage, inefficiency, and poor healthcare experience**.

---

## 💡 Our Solution – CampusCare

CampusCare is a **digital campus healthcare platform** that:

- Enables students to book appointments online  
- Shows real-time doctor availability and queue status  
- Uses **Google Gemini AI** to translate health problems into English  
- Allows doctors to approve/reject appointments in real time  
- Provides live updates using **WebSockets (Socket.IO)**  
- Ensures secure authentication via **Firebase Authentication**  

The platform improves **transparency, efficiency, and accessibility** in campus healthcare systems.

---

## 🧩 Process Flow (High Level)

1. Student logs in using Firebase Authentication  
2. Student submits a health problem (any language supported)  
3. Problem is translated to English using **Google Gemini API**  
4. Appointment request is stored in MongoDB  
5. Doctor receives request in real time  
6. Doctor approves/rejects the appointment  
7. Student gets live status updates  

---

## 🏗️ Architecture Overview

**Technology Stack (MERN + AI):**

- **Frontend:** React.js, Vite, CSS  
- **Backend:** Node.js, Express.js  
- **Database:** MongoDB Atlas  
- **Authentication:** Firebase Authentication  
- **AI Translation:** Google Gemini API  
- **Real-Time:** Socket.IO  
- **Hosting:**  
  - Frontend → Vercel  
  - Backend → Render  

---

## 👥 Team Falcons

### 🏆 Team Name: **Falcons**

| Name | Role & Contribution |
|-----|--------------------|
| **Yash Pitroda (Team Lead)** | UI improvements for all dashboards, AI translation feature, complete backend development |
| **Siddhi Biyani** | Student dashboard UI and routing |
| **Amar Kumar Sahu** | Doctor dashboard UI and routing |
| **Badal Sahoo** | Authentication flow, Login & Register page UI |

---

## 🔐 Authentication & Access

### 👨‍⚕️ Doctor Login (Prototype Only)

> ⚠️ **For demo/testing purposes only**
Email: sameer.patnaik@gmail.com
Password: yash@1029

Only **pre-approved institutional doctor emails** are allowed to access the doctor dashboard.

### 👨‍🎓 Student Login
- Students can **self-register** using Firebase Authentication  
- No demo credentials required  

---

## ✨ Key Features

### Student
- Submit health issues in any language  
- AI-powered translation to English  
- Book doctor appointments  
- View recent & past requests  
- Real-time status updates  

### Doctor
- View incoming appointments  
- See translated + original problem text  
- Approve / reject appointments  
- Manage availability (online/offline)  

### System
- Secure JWT-based API access  
- Firebase Authentication  
- Real-time updates via Socket.IO  
- Clean and responsive UI  

---

## 🔮 Future Scope & Impact

CampusCare has strong potential for real-world deployment and scaling:

- 📱 RFID / Smart ID based check-ins  
- 🏥 Real-time hardware queue integration  
- 📊 Admin dashboard with analytics  
- 🌍 Multi-language support expansion  
- 🏫 Deployment across universities & institutions  
- 🧠 AI-powered health triage & insights  

---

## ⚠️ Disclaimer

This project is a **prototype developed for hackathon and academic purposes only**.  
Doctor credentials provided are strictly for demonstration and testing.

---

## ❤️ Acknowledgements

- Google Firebase  
- Google Gemini API  
- MongoDB Atlas  
- GDG On Campus  
- Hack2Skill Platform  

---

## 📬 Contact

For any queries or collaboration:  
**Team Falcons – CampusCare**

---

⭐ *If you like this project, don’t forget to star the repository!*

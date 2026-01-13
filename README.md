# 💸 Fince - Smart AI Financial Partner

Fince is a high-performance personal finance dashboard that leverages Artificial Intelligence to transform raw expense data into actionable financial insights. Built with a focus on **UX/UI excellence** and **secure cloud architecture**.

> **Live Demo:** [https://fince.netlify.app/](https://fince.netlify.app/)

---

https://github.com/user-attachments/assets/8365fec9-c06e-4e68-86ed-ae073ac20bee

---

## 🌟 Project Highlights for Portfolio

This project demonstrates proficiency in modern full-stack development, specifically:
* **State Management**: Complex handling of local vs. cloud data synchronization.
* **AI Integration**: Prompt engineering for financial advisory via Groq.
* **Cloud Infrastructure**: Implementation of Supabase as a Backend-as-a-Service (BaaS).
* **Security**: Row Level Security (RLS) ensuring users only access their own data.

---

## 🚀 Core Features

* **🤖 AI Financial Advisor**: Real-time analysis of spending habits using LLMs to provide personalized savings recommendations.
* **🔄 Automatic Cloud Sync**: Seamlessly migrates data from `localStorage` to **Supabase DB** once the user authenticates.
* **🔐 Secure Authentication**: 
    * **Magic Link**: Passwordless login via email.
    * **Google OAuth**: One-click social login (In Progress).
* **🌓 Adaptive Design**: Fully responsive, glassmorphic UI with native Dark Mode support.
* **📊 Dynamic Insights**: Categorization and tracking of expenses with real-time balance calculation.

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React.js (Vite), Tailwind CSS |
| **Backend** | Supabase (Database & Auth) |
| **Intelligence** | Groq API |
| **Icons** | Lucide React |
| **Deployment** | Netlify |

---

## 🧠 Technical Challenges & Solutions
The Sync Dilemma: One of the main challenges was allowing users to try the app without an account. I solved this by building a migration logic that checks for localStorage data immediately after a successful SIGNED_IN event, pushing local data to the Supabase expenses table without user intervention.

---

## ☕ Support this project

If you find this project useful or it helped you in any way, consider supporting the development! Every coffee helps to keep the AI brain running.

[![Support via PayPal](https://img.shields.io/badge/Donate-PayPal-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/carlosrw231005)

---

## 👨‍💻 Author

<table border="0">
  <tr>
    <td width="120px">
      <img src="https://github.com/CarlosRW.png" width="100px" style="border-radius: 50%;" />
    </td>
    <td>
      <strong>Carlos Ramírez Wong</strong><br />
      <em>Full Stack Developer & AI Enthusiast</em><br />
      <br />
      <a href="https://github.com/CarlosRW">
        <img src="https://img.shields.io/badge/GitHub-181717?style=flat-square&logo=github&logoColor=white" />
      </a>
      <a href="https://www.linkedin.com/in/carlosrw">
        <img src="https://img.shields.io/badge/LinkedIn-0A66C2?style=flat-square&logo=linkedin&logoColor=white" />
      </a>
    </td>
  </tr>
</table>

---

<p align="center">
  <i>Developed as a showcase of modern web capabilities and AI integration.</i><br />
  <strong>© 2026 Fince AI</strong>
</p>

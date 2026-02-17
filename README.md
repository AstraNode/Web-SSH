# Web SSH Terminal

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=next.js&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)

![View Counter](https://count.getloli.com/get/@AstraNode?theme=capoo-2)

A feature-rich, web-based SSH terminal built with Next.js, React, and Socket.io. This application allows you to connect to and manage remote servers directly from your browser with a fully functional, responsive terminal interface.

## ✨ Features

- **🖥️ Web-Based SSH Client**: Connect to any SSH server using hostname, port, and username.
- **🔐 Secure Authentication**: Supports both **Password** and **Private Key** authentication methods.
- **📑 Multiple Sessions**: Open and manage multiple active terminal sessions simultaneously in tabs.
- **⚡ Real-time Terminal**: Powered by [xterm.js](https://xtermjs.org/) and [Socket.io](https://socket.io/) for a low-latency, native-like terminal experience.
- **💾 Connection Management**: Save frequently used host details for quick access (credentials are never stored for security).
- **🎨 Modern UI**: Built with [Radix UI](https://www.radix-ui.com/) and [Tailwind CSS](https://tailwindcss.com/) for a clean, accessible, and responsive design.
- **📏 Resizable Terminal**: Automatically fits to the container and supports window resizing.

## 🛠️ Tech Stack

- **Frontend**: [Next.js 14](https://nextjs.org/) (App Router), [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/), [Radix UI](https://www.radix-ui.com/), [Lucide React](https://lucide.dev/) (Icons)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Backend / Communication**: [Socket.io](https://socket.io/), [Node.js](https://nodejs.org/)
- **SSH & Terminal**: [ssh2](https://github.com/mscdex/ssh2), [xterm.js](https://xtermjs.org/)

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm, yarn, or pnpm

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/AstraNode/Web-SSH.git
    cd ssh-terminal
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    ```

3.  **Run the development server:**

    ```bash
    npm run dev
    ```

4.  **Open the application:**

    Open your browser and navigate to `http://localhost:3000`.

## 📦 Building for Production

To create a production build:

```bash
npm run build
npm start
```

## 🚀 Deployment

### ⚠️ Important Note
This application uses **WebSockets** (`socket.io`) and a custom Node.js server (`server.ts`) to handle SSH connections. **Serverless platforms like Vercel or Netlify do not support persistent WebSocket connections.**

- **Vercel / Netlify**: You can deploy the frontend securely, but the SSH terminal functionality **will not work**.
- **Recommended**: Deploy on a VPS (DigitalOcean, Linode, AWS EC2) or a PaaS that supports long-running Node.js processes (Railway, Render, Heroku).

### Vercel Deployment (Frontend Only)

If you still wish to deploy the frontend to Vercel (e.g., for testing the UI), you can use the provided `vercel.json`.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyourusername%2Fssh-terminal)

### Docker Deployment (Recommended)

For a fully functional production deployment, use Docker.

1.  **Build the image:**
    ```bash
    docker build -t ssh-terminal .
    ```

2.  **Run the container:**
    ```bash
    docker run -p 3000:3000 ssh-terminal
    ```

## 🔒 Security Note

This application acts as a bridge between your browser and the SSH server.
- **Credentials**: Passwords and private keys are sent to the server **only** to establish the SSH connection and are **not** stored permanently in the database or filesystem.
- **HTTPS**: For production deployments, ensure you run this application behind a reverse proxy (like Nginx) with **HTTPS enabled** to encrypt the traffic between the browser and the Next.js server.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

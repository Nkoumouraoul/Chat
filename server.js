// Fichier : /socket-server/server.js

const { createServer } = require("http");
const { Server } = require("socket.io");

const httpServer = createServer();

const io = new Server(httpServer, {
  cors: {
    origin: "*", // IMPORTANT : Pour commencer. Vous pourrez le restreindre plus tard.
    methods: ["GET", "POST"]
  }
});

const utilisateurs = new Map(); // userId => socket.id

io.on("connection", (socket) => {
  console.log(`✅ Un client s'est connecté : ${socket.id}`);

  socket.on("register", (userId) => {
    if (userId) {
      const id = String(userId);
      utilisateurs.set(id, socket.id);
      socket.userId = id; // Attacher l'ID de l'utilisateur à l'objet socket
      console.log(`👤 Utilisateur ${id} enregistré avec le socket ${socket.id}`);
      io.emit('user-status', { userId: id, status: 'online' }); // Informer les autres que cet utilisateur est en ligne
      console.log("Utilisateurs en ligne:", Object.fromEntries(utilisateurs));
    }
  });

  // Gestion des appels WebRTC (votre code est bon)
  socket.on("call", ({ to, offer, type, fromName }) => {
    const destSocketId = utilisateurs.get(String(to));
    if (destSocketId) {
      io.to(destSocketId).emit("call", { from: socket.userId, fromName, offer, type });
    }
  });

  socket.on("answer", ({ to, answer }) => {
    const destSocketId = utilisateurs.get(String(to));
    if (destSocketId) {
      io.to(destSocketId).emit("answer", { from: socket.userId, answer });
    }
  });

  socket.on("ice-candidate", ({ to, candidate }) => {
    const destSocketId = utilisateurs.get(String(to));
    if (destSocketId) {
      io.to(destSocketId).emit("ice-candidate", { from: socket.userId, candidate });
    }
  });

  socket.on("end-call", ({ to }) => {
    const destSocketId = utilisateurs.get(String(to));
    if (destSocketId) {
      io.to(destSocketId).emit("end-call", { from: socket.userId });
    }
  });

  socket.on("disconnect", () => {
    if (socket.userId) {
      utilisateurs.delete(socket.userId);
      console.log(`🔌 Utilisateur ${socket.userId} déconnecté.`);
      io.emit('user-status', { userId: socket.userId, status: 'offline' }); // Informer les autres de la déconnexion
      console.log("Utilisateurs restants :", Object.fromEntries(utilisateurs));
    }
  });
});

// --- CORRECTION CRUCIALE POUR RENDER ---
// Utiliser le port fourni par l'environnement de Render, ou 4000 par défaut en local.
const PORT = process.env.PORT || 4000;// 3. On demande au serveur HTTP d'écouter sur le port, pas à Socket.IO directement.

httpServer.listen(PORT, () => {
  console.log(`🚀 Serveur Socket.IO démarré et à l'écoute sur le port ${PORT}`);
});
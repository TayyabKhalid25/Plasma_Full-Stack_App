// Simple in-memory presence tracker
const onlineUsers = new Set();

module.exports = {
    onlineUsers,
    isOnline: (userId) => onlineUsers.has(userId),
    setOnline: (userId) => onlineUsers.add(userId),
    setOffline: (userId) => onlineUsers.delete(userId)
};

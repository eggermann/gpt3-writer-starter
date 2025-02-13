
import './../css/styles.scss';
import { login, fetchChatHistory, insertChatHistory } from './chat';

document.addEventListener('DOMContentLoaded', async () => {
    const chatHistoryContainer = document.getElementById('chat-history');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');

    const chatHistory = await login();

    // Display chat history
    chatHistory.forEach(entry => {
        const message = entry.chathistory.map(chat => `${chat.role}: ${chat.content}`).join('\n');
        const chatMessage = document.createElement('div');
        chatMessage.textContent = message;
        chatHistoryContainer.appendChild(chatMessage);
    });

    // Handle sending new messages
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newMessage = chatInput.value.trim();
        if (newMessage) {
            await insertChatHistory({
                chathistory: [{ role: "user", content: newMessage }],
            });
            chatInput.value = ''; // Clear input
            window.location.reload(); // Reload to update chat
        }
    });
});

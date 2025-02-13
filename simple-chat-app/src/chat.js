import { supabase } from './supabaseClient';
import { v4 as uuidv4 } from 'uuid'; // Install with `npm install uuid`

const yourTableName = 'date_a_bot_or_not';

// Generate or retrieve the session ID
const getSessionId = () => {
    let sessionId = localStorage.getItem('session_id');
    if (!sessionId) {
        sessionId = uuidv4(); // Generate a new session ID
        localStorage.setItem('session_id', sessionId);
    }
    return sessionId;
};

export const fetchChatHistory = async () => {
    const sessionId = getSessionId();

    // Fetch chat history filtered by session ID
    const { data, error } = await supabase
        .from(yourTableName)
        .select('*')
        .eq('id', sessionId) // Filter by session ID
        .order('id', { ascending: true });

    if (error) {
        console.error("Error fetching chat history:", error);
        return [];
    }

    // Map the data to the specified model format
    return data.map(item => ({
        chathistory: item.chathistory.map(chat => ({
            type: chat.type || 'unknown',
            id: chat.id || sessionId,
            password: chat.password || '',
            secret: chat.secret || '',
            passwordVector: chat.passwordVector || '',
            image: chat.image || { src: '', alt: '' },
            category: chat.category || [],
            username: chat.username || 'Unknown',
        })) || [],
    }));
};

export const insertChatHistory = async (chatData) => {
    const sessionId = getSessionId();

    // Prepare data with session ID
    const formattedData = {
        ...chatData,
        id: sessionId, // Map the session ID
    };

    const { error } = await supabase
        .from(yourTableName)
        .insert(formattedData);

    if (error) {
        console.error("Error inserting chat history:", error);
    }
};

export const login = async () => {
    let chatHistory = await fetchChatHistory();

    if (chatHistory.length === 0) {
        const username = prompt("Please enter your username:");
        if (username) {
            const sessionId = getSessionId();
            const newChatEntry = {
                id: sessionId, // Use session ID
                chathistory: [{
                    type: "system",
                    id: sessionId,
                    password: "",
                    secret: "",
                    passwordVector: "",
                    image: { src: "", alt: "" },
                    category: ["system"],
                    username: username,
                }],
            };
            await insertChatHistory(newChatEntry);
            chatHistory = await fetchChatHistory(); // Refresh chat history
        }
    }
    return chatHistory;
};
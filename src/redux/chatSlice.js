import { createSlice } from '@reduxjs/toolkit';


const initialState = {
    username: null,
    id: null,
    onlinePeople: {},
    offLinePeople: {},
    selectedUserId: null,
    messages: [],
    newMessageIndicators: [],
};

const chatSlice = createSlice({
    name: "chat",
    initialState,
    reducers: {
        setLoggedInUsername(state, action) {
            state.username = action.payload;
        },
        setId(state, action) {
            state.id = action.payload;
        },
        setOnlinePeople(state, action) {
            state.onlinePeople = action.payload;
        },
        setOffLinePeople(state,action) {
            state.offLinePeople = action.payload;
        },
        setSelectedUserId(state, action) {
            console.log("selectedUserId:", action.payload);
            state.selectedUserId = action.payload;
        },
        setMessages(state, action) {
            state.messages = action.payload;
        },
        addMessages(state, action) {
            state.messages.push(action.payload);
        },
        clearMessages(state) {
            state.messages = [];
        },
        markMessageAsRead(state, action) {
            const sendTime = action.payload;
            state.messages = state.messages.map( message => 
                message._id === sendTime 
                ? {...message, readByRecipient: true}
                : message);
        },
        markAllMessagesAsRead(state) {
            state.messages.forEach(message => {
                message.readByRecipient = true; // 直接修改每個訊息的屬性
            });
        },
        addNewMessageIndicators(state, action) {
            const senderId = action.payload;
            if (!state.newMessageIndicators.includes(senderId)) {
                state.newMessageIndicators.push(senderId);
            }
        },
        removeNewMessageIndicators(state, action) {
            const senderId = action.payload;
            state.newMessageIndicators = state.newMessageIndicators.filter(id => id !== senderId);
        }
    }
});

export const {
    setLoggedInUsername,
    setId,
    setWs,
    setOnlinePeople,
    setOffLinePeople,
    setSelectedUserId,
    setMessages,
    addMessages,
    clearMessages,
    markMessageAsRead,
    markAllMessagesAsRead,
    addNewMessageIndicators,
    removeNewMessageIndicators,
} = chatSlice.actions;

export default chatSlice.reducer

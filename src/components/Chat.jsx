import { useEffect, useRef, useState } from "react";
import Logo from "./Logo";
import Contact from "./Contact";

import { useSelector, useDispatch } from 'react-redux';
import { setOnlinePeople, setOffLinePeople, setSelectedUserId, setMessages, addMessages, markMessageAsRead, setId, setLoggedInUsername, markAllMessagesAsRead, addNewMessageIndicators, removeNewMessageIndicators } from '../redux/chatSlice';

import EmojiPicker from 'emoji-picker-react';

import { uniqBy } from "lodash";
import axios from "axios";
import Avatar from "./Avatar";




function Chat() {
    const dispatch = useDispatch();
    const { onlinePeople, offLinePeople, selectedUserId, messages, username, id } = useSelector(state => state.chat)
    const [newMessageText, setNewMessageText] = useState(""); //處理發送訊息用
    const [open, setOpen] = useState(false);
    const [filteredPeople, setFilteredPeople] = useState({});
    const [isMobile, setIsMobile] = useState(false);

    const ws = useRef(null);
    const divUnderMessages = useRef();
    const messagesRef = useRef(messages);
    const selectedUserIdRef = useRef(selectedUserId);

    


    useEffect(() => {
        connectToWs();

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => {                          //useEffect的特別寫法: 在useEffect中使用return時，是用來繼立一個清理函式，這個函式只在component卸載(比如:跳轉到其他頁面像是登出頁面、關閉瀏覽器時觸發這個清理函式)
            // 在組件卸載時關閉 WebSocket 連接
            if (ws.current) {
                ws.current.close(); // 在組件卸載時立即關閉 WebSocket
            }
            window.removeEventListener('resize', handleResize);
        };

    }, [])

    function connectToWs() {
        if (ws.current && (ws.current.readyState === WebSocket.OPEN || ws.current.readyState === WebSocket.CONNECTING)) {
            console.log("WebSocket is already connected or connecting.");
            return;
        }


        ws.current = new WebSocket("wss://chat-app-server-c0q0.onrender.com");   //與目的地建立websocket連線

        ws.current.addEventListener("message", handleMessage);   //監聽對象:ws (即與url指向的伺服器的websocket連線);監聽事件:伺服器向客戶端發送message
        ws.current.addEventListener("close", () => {
            setTimeout(() => {
                console.log('Disconnected. Trying to reconnect.');
                connectToWs();
            }, 1000);
        });
    };

    //根據最新訊息，將聊天室下拉到當前最新訊息
    //策略:在每次渲染出來的訊息JSX底下多添加一個div作為Ref
    useEffect(() => {
        if (divUnderMessages.current) {             //為何寫成條件式?: 因為初次渲染時，可能聊天室沒有任何訊息，那麼divUnderMessages也沒有被渲染。
            divUnderMessages.current.scrollIntoView({ behavior: "auto" });
        }
        messagesRef.current = messages;
    }, [messages]);




    //根據當前在線用戶顯示離線用戶
    useEffect(() => {
        axios.get("/people")
            .then(res => {
                const offLinePeopleArr = res.data
                    .filter(person => person._id !== id)
                    .filter(person => !Object.keys(onlinePeople).includes(person._id));
                const offLinePeople = {}
                offLinePeopleArr.forEach(person => {
                    offLinePeople[person._id] = person.username;
                })
                dispatch(setOffLinePeople(offLinePeople));
            })
    }, [onlinePeople]);



    const showOnlinePeople = (peopleArray) => {
        const people = {};
        peopleArray.forEach(({ userId, username }) => {
            people[userId] = username;
        });
        dispatch(setOnlinePeople(people));
    };

    //根據所選聊天對象更新歷史訊息
    useEffect(() => {
        // dispatch(clearMessages());
        // console.log(messages);
        if (selectedUserId) { //debug:加入條件式，避免頁面重新渲染時selectedUser為null，卻向伺服器發送請求，導致頁面渲染錯誤
            axios.get("/messages/" + selectedUserId)
                .then(res => {
                    dispatch(setMessages(res.data));
                    dispatch(removeNewMessageIndicators(selectedUserId));
                })
                .catch((error) => {
                    if (error) throw error;
                })


            if (ws.current && ws.current.readyState === WebSocket.OPEN) {
                ws.current.send(JSON.stringify({
                    type: "selected_user_change",
                    userId: id,
                    selectedUserId: selectedUserId,
                }));
            } else {
                // 如果 WebSocket 仍處於 CONNECTING 狀態，等待它完全打開後再發送訊息
                ws.current.addEventListener('open', () => {
                    ws.current.send(JSON.stringify({
                        type: "selected_user_change",
                        userId: id,
                        selectedUserId: selectedUserId,
                    }));
                });
            }
            selectedUserIdRef.current = selectedUserId;
            console.log(selectedUserIdRef.current);
        };
    }, [selectedUserId]);



    useEffect(() => {
        setFilteredPeople(allPeople);
    }, [onlinePeople, offLinePeople]);







    const handleMessage = (e) => {                          //此處event指向伺服器向客戶端進行的行為，比如connection.send("......")
        const messageData = JSON.parse(e.data);
        console.log({ e, messageData });


        if ("online" in messageData) {                      //解析wss送來的訊息:哪些人正在線上
            showOnlinePeople(messageData.online);
        }
        else if ("text" in messageData || "file" in messageData) {

            if (messageData.sender === selectedUserIdRef.current && messageData.recipient === id) {
                dispatch(addMessages(messageData));
                // console.log(messageData.sender, selectedUserId);

                if (ws.current.readyState === WebSocket.OPEN) {
                    ws.current.send(JSON.stringify({
                        type: "read",
                        message_id: messageData._id,
                        recipient: selectedUserIdRef.current,
                        sender: id,
                        sendTime: messageData.sendTime,
                    }));
                } else {
                    console.log("WebSocket is not open!");
                }
            }
            else {
                dispatch(addNewMessageIndicators(messageData.sender));
                console.log("New Messages!");
            }
        }
        else if (messageData.type === "read") {
            const { sendTime } = messageData;
            console.log('Checking read status:', messageData.yourChatPartnerIsChattingWith, id);
            if (messageData.yourChatPartnerIsChattingWith
                === id) {
                setTimeout(() => {
                    dispatch(markMessageAsRead(sendTime));
                }, 1000);
            }

        }
        else if (messageData.type === "all-read") {
            dispatch(markAllMessagesAsRead());
        }

    };


    const onlinePeopleExcludeOurUser = { ...onlinePeople };     //處理:避免顯示用戶本人在聯絡人列上
    delete onlinePeopleExcludeOurUser[id];


    const sendMessage = (e, file = null) => {
        if (e) e.preventDefault();
        const messageToSend = {
            recipient: selectedUserId,
            text: newMessageText,
            file,
            sender: id,
            _id: Date.now(), // 這裡賦予每則訊息一個唯一的_id，方便使用uniqBy();
            readByRecipient: false
        };

        setOpen(false);
        ws.current.send(JSON.stringify(messageToSend));
        dispatch(addMessages(messageToSend));
        setNewMessageText("");
    };

    const messagesWithoutDupes = uniqBy(messages, "_id");  //使用lodash函式庫，目標:去除因為react-app在開發環境下的二重複渲染特性造成該Array始終存在一則相同element，即一個訊息在該array中存在兩組!
    //參數1: 要處理的Array; 參數2: 篩選的屬性，此根據_id進行去重複，_id可參閱server.js的將訊息發送給特定用戶端(聊天對象)，_id是指向MongoDB資料庫中的獨立屬性，可以很好地避免重複問題

    const sendFile = (e) => {
        const reader = new FileReader();
        reader.readAsDataURL(e.target.files[0]);
        reader.onload = () => {
            sendMessage(null, {
                name: e.target.files[0].name,
                data: reader.result,
            });
        };
    };


    const logout = () => {
        axios.post("/logout").then(() => {
            dispatch(setId(null));
            dispatch(setLoggedInUsername(null));
        })
    };

    const formateTimeForEachMessage = (timestamp) => {
        const date = new Date(timestamp);
        const hours = String(date.getHours()).padStart(2, '0');
        const mins = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${mins}`;
    }


    const compareDateForMessages = (timestamp1, timestamp2) => {
        const d1 = new Date(timestamp1);
        const d2 = new Date(timestamp2);
        return d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate();

    }

    const weekDay = ["Sunday", "Monday", "Tuseday", "wednesday", "Thursday", "Friday", "Saturday"]

    const allPeople = { ...onlinePeopleExcludeOurUser, ...offLinePeople };

    const handleFilterPeople = (e) => {
        const peopleFound = Object.entries(allPeople)
            .filter(([key, value]) => value.toLowerCase().includes(e.target.value.toLowerCase()))
            .reduce((acc, [key, value]) => {
                acc[key] = value;
                return acc;
            }, {});

        setFilteredPeople(peopleFound);
    }

    const handleResize = () => {
        setIsMobile(window.innerWidth < 768);
    }

    const contactBlock = document.getElementById("contactBlock");
    const chatBlock = document.getElementById("chatBlock");

    const showChatBlock = () => {
        if (selectedUserId && isMobile) {
            chatBlock.classList.remove("hidden");
            contactBlock.classList.add("hidden");
        }
    }

    const showContactBlock = () => {
        if (isMobile) {
            chatBlock.classList.add("hidden");
            contactBlock.classList.remove("hidden");
            dispatch(setSelectedUserId("none"));
        }
    }

    return (
        <div className="flex h-screen">
            <div className="w-full md:w-1/3 flex flex-col contact-block " id="contactBlock">
                <div className="grow p-2">
                    <div>
                        <Logo />
                        <div className="px-2">
                            <div className=" mx-4 flex text-lg relative">
                                <div className="mr-2 text-white">Welcome!</div>
                                <div>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="white" className="size-6">
                                        <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12.735 14c.618 0 1.093-.561.872-1.139a6.002 6.002 0 0 0-11.215 0c-.22.578.254 1.139.872 1.139h9.47Z" />
                                    </svg>
                                </div>
                                <div className="text-white">
                                    {username}
                                </div>
                                <div className="absolute right-4 bottom-0">
                                    <Avatar userId={id} username={username} online={true} radius={10}/>
                                </div>
                                
                            </div>
                            <div className="px-4 mt-6">
                                <div className="mb-4 flex bg-white rounded-md">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="black" className="size-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                                    </svg>
                                    <input type="text" className="rounded-md w-full" onChange={e => handleFilterPeople(e)} placeholder="Search friends....." />
                                </div>
                            </div>
                            <hr className="mx-4" />
                            <div className=" overflow-y-auto p-4">
                                <div className="text-white mb-2">Friends:</div>
                                {Object.keys(filteredPeople).map(userId => (
                                    <Contact
                                        key={userId}
                                        id={userId}
                                        online={Object.keys(onlinePeople).includes(userId) ? true : false}
                                        username={filteredPeople[userId]}
                                        onClick={() => { dispatch(setSelectedUserId(userId)); showChatBlock() }}
                                        selected={userId === selectedUserId}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="p-2 flex items-center justify-center mb-2">
                    <button
                        onClick={logout}
                        className="py-1 px-2 text-sm text-black rounded-md">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="size-6">
                            <path fillRule="evenodd" d="M12 2.25a.75.75 0 0 1 .75.75v9a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75ZM6.166 5.106a.75.75 0 0 1 0 1.06 8.25 8.25 0 1 0 11.668 0 .75.75 0 1 1 1.06-1.06c3.808 3.807 3.808 9.98 0 13.788-3.807 3.808-9.98 3.808-13.788 0-3.808-3.807-3.808-9.98 0-13.788a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            </div>
            <div className={`chat-block flex flex-col w-full md:w-2/3 p-2 ${isMobile ? "hidden" : ""}`} id="chatBlock" >
                <div className="grow">
                    {(!selectedUserId || selectedUserId === "none") && (
                        <div className="flex h-full items-center justify-center">
                            <div className="font-bold text-gray-300">&larr; selecte a person from the left side</div>
                        </div>
                    )}
                    {!!selectedUserId && (
                        <div className="relative h-full">
                            <div className=" text-white flex justify-between items-center w-full text-lg">
                                <button type="button" className="block md:hidden" onClick={showContactBlock}>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
                                    </svg>
                                </button>
                                <div className="w-10 hidden md:block"></div>
                                <div className="flex">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                                        <path d="M4.5 6.375a4.125 4.125 0 1 1 8.25 0 4.125 4.125 0 0 1-8.25 0ZM14.25 8.625a3.375 3.375 0 1 1 6.75 0 3.375 3.375 0 0 1-6.75 0ZM1.5 19.125a7.125 7.125 0 0 1 14.25 0v.003l-.001.119a.75.75 0 0 1-.363.63 13.067 13.067 0 0 1-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 0 1-.364-.63l-.001-.122ZM17.25 19.128l-.001.144a2.25 2.25 0 0 1-.233.96 10.088 10.088 0 0 0 5.06-1.01.75.75 0 0 0 .42-.643 4.875 4.875 0 0 0-6.957-4.611 8.586 8.586 0 0 1 1.71 5.157v.003Z" />
                                    </svg>
                                    {Object.entries(filteredPeople).find(([key]) => key === selectedUserId)?.[1]}
                                </div>
                                <div className="w-10"></div>
                            </div>
                            <div className="overflow-y-auto absolute top-8 right-0 left-0 bottom-3">
                                {messagesWithoutDupes
                                    .filter(message => message.sender === selectedUserId || message.recipient === selectedUserId)
                                    .map((message, index) => (
                                        <div key={message._id}>
                                            <div>
                                                {(index === 0 || !compareDateForMessages(Number(message.sendTime || message._id), Number(messagesWithoutDupes[index - 1].sendTime) || Number(messagesWithoutDupes[index - 1]._id))) && (
                                                    <div className="text-center text-black my-2 border border-white rounded-md bg-gray-200 w-20 mx-auto">
                                                        <div>{
                                                            (new Date(Number(message.sendTime || message._id)).getMonth() + 1) + "/" + (new Date(Number(message.sendTime || message._id)).getDate())
                                                        }</div>
                                                        <div>{weekDay[new Date(Number(message.sendTime || message._id)).getDay()]}</div>
                                                    </div>
                                                )}
                                            </div>
                                            <div className={message.sender === id ? "text-right mr-2" : "text-left"}>
                                                <div className={"flex mt-4 items-end " + (message.sender === id ? "flex-row-reverse" : "")}>
                                                    <div className={"text-left p-2 rounded-md text-sm max-w-60 md:max-w-md break-words " + (message.sender === id ? "bg-blue-500 text-white" : "bg-gray-700 text-white")}>
                                                        {message.text}
                                                        {message.file && (
                                                            <div>
                                                                <a target="_blank"
                                                                    href={axios.defaults.baseURL + "/uploads/" + message.file.name}
                                                                    className="underline flex items-center gap-1 flex-wrap">
                                                                    <div className="flex">
                                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4 flex-shrink-0">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
                                                                        </svg>
                                                                        <div className="break-all">{message.file.name}</div>
                                                                    </div>
                                                                </a>
                                                                <img src={axios.defaults.baseURL + "/uploads/" + message.file.name} className="mt-2" />
                                                            </div>
                                                        )}

                                                    </div>

                                                    <div className="text-sm text-gray-400 mx-2">{message.sendTime ? formateTimeForEachMessage(Number(message.sendTime)) : formateTimeForEachMessage(Number(message._id))}</div>
                                                </div>
                                                {message.sender === id && message.readByRecipient === true && (
                                                    <div className="text-xs text-gray-500">read</div>
                                                )}

                                            </div>
                                        </div>
                                    ))}
                                <div ref={divUnderMessages} />
                            </div>
                        </div>
                    )}
                </div>
                {!!selectedUserId && (      //強制將selectedUsrId轉為boolean value
                    <div>
                        <div>
                            <EmojiPicker
                                open={open}
                                onEmojiClick={emoji => setNewMessageText(prev => prev + emoji.emoji)}
                                width={"100%"}
                                emojiStyle="facebook"
                            />
                        </div>

                        <form className="flex gap-2" onSubmit={sendMessage}>
                            <input type="text"
                                value={newMessageText}
                                onChange={e => setNewMessageText(e.target.value)}
                                placeholder="Type your message here"
                                className="bg-white border p-2 w-full rounded-md" />
                            <button type="button" onClick={() => setOpen(prev => !prev)}>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="curColor" className="size-6">
                                    <circle cx="12" cy="12" r="9.75" fill="black" />
                                    <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-2.625 6c-.54 0-.828.419-.936.634a1.96 1.96 0 0 0-.189.866c0 .298.059.605.189.866.108.215.395.634.936.634.54 0 .828-.419.936-.634.13-.26.189-.568.189-.866 0-.298-.059-.605-.189-.866-.108-.215-.395-.634-.936-.634Zm4.314.634c.108-.215.395-.634.936-.634.54 0 .828.419.936.634.13.26.189.568.189.866 0 .298-.059.605-.189.866-.108.215-.395.634-.936.634-.54 0-.828-.419-.936-.634a1.96 1.96 0 0 1-.189-.866c0-.298.059-.605.189-.866Zm2.023 6.828a.75.75 0 1 0-1.06-1.06 3.75 3.75 0 0 1-5.304 0 .75.75 0 0 0-1.06 1.06 5.25 5.25 0 0 0 7.424 0Z" clipRule="evenodd" fill="orange" />
                                </svg>
                            </button>

                            <label type="button" className="bg-gray-600 text-white p-2 rounded-md cursor-pointer">
                                <input type="file" className="hidden" onChange={sendFile} />
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
                                </svg>
                            </label>
                            <button type="submit" className="bg-blue-500 p-2 text-white rounded-md">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                                </svg>
                            </button>
                        </form>
                    </div>
                )}

            </div>
        </div>
    );
};

export default Chat;
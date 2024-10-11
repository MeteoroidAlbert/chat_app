import axios from "axios";
import { useEffect } from "react";
import Routes from "./Routes";



import { useSelector, useDispatch } from 'react-redux';
import { setLoggedInUsername, setId } from "../redux/chatSlice";






function App() {
  const dispatch = useDispatch();


  useEffect(() => {
    let URL;
    if (window.location.hostname === "localhost") {
      URL = "http://localhost:5000";
    } else {
      URL = "https://chat-app-server-c0q0.onrender.com";
    }

    axios.defaults.baseURL = URL;
    axios.defaults.withCredentials = true;
    axios.get("/profile")
      .then(res => {
        dispatch(setId(res.data.userId));
        dispatch(setLoggedInUsername(res.data.username));
      })
  }, [])





  return (
    <div>
      <Routes />
    </div>
  )
}

export default App

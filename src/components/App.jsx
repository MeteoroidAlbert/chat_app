import axios from "axios";
import { useEffect } from "react";
import Routes from "./Routes";



import { useSelector, useDispatch } from 'react-redux';
import { setLoggedInUsername, setId } from "../redux/chatSlice";






function App() {
  const dispatch = useDispatch();
  

  useEffect(() => {
    axios.get("/profile")
      .then(res => {
        dispatch(setId(res.data.userId));
        dispatch(setLoggedInUsername(res.data.username));
      })
  }, [])

  let URL;
  if(window.location.hostname === "localhost") {
      URL = "http://localhost:5000";
  }
  else if (window.location.hostname === "meteoroidalbert.github.io") {
      URL = "https://chat-app-server-c0q0.onrender.com";
  }



  axios.defaults.baseURL = URL;
  axios.defaults.withCredentials = true;
  return (
    <div>
      <Routes />
    </div>
  )
}

export default App

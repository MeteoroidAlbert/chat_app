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

  axios.defaults.baseURL = "http://localhost:5000";
  axios.defaults.withCredentials = true;
  return (
    <div>
      <Routes />
    </div>
  )
}

export default App

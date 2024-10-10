import axios from "axios";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { setLoggedInUsername, setId } from "../redux/chatSlice";
import Logo from "./Logo";


function RegisterAndLoginForm() {
    const dispatch = useDispatch();

    const [usernameRL, setUsernameRL] = useState("");
    const [password, setPassword] = useState("");
    const [isLoginOrRegister, setIsLoginOrRegister] = useState("login");


    const handleSubmit = (event) => {
        const url = isLoginOrRegister === "register" ? "/register" : "/login"
        event.preventDefault();
        axios({
            method: "post",
            url: url,
            data: {
                username: usernameRL,
                password: password
            }
        }).then(res => {
            dispatch(setLoggedInUsername(usernameRL));
            dispatch(setId(res.data.id));
        })
    }

    return (
        <div className="register-and-login-page h-screen flex justify-center items-center">
            <div className="flex flex-col items-center gap-4">
                <Logo />
                <form className="w-64 mx-auto mb-12" onSubmit={handleSubmit}>
                    <input type="text" placeholder="username"
                        value={usernameRL}
                        onChange={event => setUsernameRL(event.target.value)}
                        className="block w-full rounded-sm p-2 mb-2 border" />
                    <input type="password"
                        value={password}
                        onChange={event => setPassword(event.target.value)}
                        placeholder="password" className="block w-full rounded-sm p-2 mb-2 border" />
                    <button className="bg-blue-500 text-white block w-full rounded-sm p-2">
                        {isLoginOrRegister === "register" ? "Register" : "Login"}
                    </button>
                    <div className="text-white">
                    {isLoginOrRegister === "register" && (
                        <div className="text-center mt-2">
                            Already a member?
                            <button className="ml-1" onClick={() => setIsLoginOrRegister("login")}>
                                Login here!
                            </button>
                        </div>
                    )}
                    {isLoginOrRegister === "login" && (
                        <div className="text-center mt-2">
                            Dont have an account?
                            <button className="ml-1" onClick={() => setIsLoginOrRegister("register")}>
                                Register here!
                            </button>
                        </div>
                    )}
                    </div>
                </form>
            </div>
        </div>
    );
}

export default RegisterAndLoginForm;
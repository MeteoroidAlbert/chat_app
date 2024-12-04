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
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = (event) => {
        setError("");
        setLoading(true);
        const url = isLoginOrRegister === "register" ? "/chat/register" : "/chat/login"
        event.preventDefault();
        axios({
            method: "post",
            url: url,
            data: {
                username: usernameRL,
                password: password
            }
        }).then(res => {
            setLoading(false);
            dispatch(setLoggedInUsername(usernameRL));
            dispatch(setId(res.data.id));
        }).catch(err => {
            setLoading(false);
            console.log(err.response);
            setError(err.response.data.message);
        })
    }

    return (
        <div className="register-and-login-page h-screen flex justify-center items-center">
            <div className="flex flex-col items-center">
                <Logo />
                <form className="w-64 mx-auto" onSubmit={handleSubmit}>
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
                </form>
                {loading && (
                    <div className="spinner-border text-light mt-2" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                )}
                {error && (
                    <div className="text-red-500 mt-2">{error}</div>
                )}
                <div className="text-white mt-4">
                    {isLoginOrRegister === "register" && (
                        <div className="text-center">
                            Already a member?
                            <button className="ml-1" onClick={() => setIsLoginOrRegister("login")}>
                                Login here!
                            </button>
                        </div>
                    )}
                    {isLoginOrRegister === "login" && (
                        <div className="text-center">
                            Don&apos;t have an account?
                            <button className="ml-1" onClick={() => setIsLoginOrRegister("register")}>
                                Register here!
                            </button>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}

export default RegisterAndLoginForm;
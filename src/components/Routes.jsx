import { useSelector } from "react-redux";
import Chat from "./Chat";
import RegisterAndLoginForm from "./RegisterAndLoginForm";


function Routes () {
    const { username } = useSelector(state => state.chat)

    if (username) {
        return <Chat/>
    }

    return (
        <RegisterAndLoginForm/>
    );
}

export default Routes;
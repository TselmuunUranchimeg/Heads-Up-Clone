import { Link } from "react-router-dom";
import "./Homepage.css";

const Homepage = () => {
    return (
        <div className = "absolute homepage">
            <h1>Welcome to Heads Up</h1>
            <Link to = "/room/create" >Create room</Link>
            <Link to = "/room/join" >Join room</Link>
            <Link to = "/auth/login">Log in</Link>
        </div>
    )
}

export default Homepage;
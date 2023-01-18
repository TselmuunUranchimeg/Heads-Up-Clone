import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import "./Homepage.css";

const Homepage = () => {
    return (
        <div className = "absolute homepage">
            <Helmet>
                <meta charSet="utf-8" />
                <title>Heads Up Clone</title>
                <meta 
                    name="description" 
                    content = "This is a side project that captures the famous Heads Up game in an online environment. The purpose of this project is to showcase the developer's capabilities as a full stack developer and not for commercial use." 
                />
            </Helmet>
            <h1>Welcome to Heads Up</h1>
            <Link to = "/room/create" >Create room</Link>
            <Link to = "/room/join" >Join room</Link>
            <Link to = "/auth/login">Log in</Link>
        </div>
    )
}

export default Homepage;
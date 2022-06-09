import { CSSProperties } from "react";
import WbCloudyIcon from '@mui/icons-material/WbCloudy';
import "./Background.css";

interface CloudInterface {
    style?: CSSProperties;
    className?: string;
}

const CloudFront = ({ style, className }: CloudInterface) => {
    return (
        <div className = {`cloudFront ${className ?? ""}`} style = {style ?? {}}>
            <WbCloudyIcon className = "front-cloud" />
            <WbCloudyIcon className = "back-cloud" />
        </div>
    )
}

const CloudBack = ({ style, className }: CloudInterface) => {
    return (
        <div className = {`cloudBack ${className ?? ""}`} style = {style ?? {}}>
            <WbCloudyIcon className = "front-cloud" />
            <WbCloudyIcon className = "back-cloud" />
        </div>
    )
}

const Cloud = ({ style, className }: CloudInterface) => {
    return(
        <WbCloudyIcon className = {`single-cloud ${className}`} style = {style} />
    )
}

const Background = () => {
    return (
        <div className = "background">
            <CloudFront style = {{top: "0", animationDuration: "13s"}} />
            <CloudBack style = {{top: "9%", animationDuration: "15s"}} />
            <CloudFront style = {{top: "13%", animationDuration: "12s"}}/>
            <Cloud style = {{top: "18%", animationDuration: "18s"}} />
            <CloudFront style = {{top: "22%", animationDuration: "20s"}}/>
            <CloudBack style = {{top: "38%", animationDuration: "17s"}} />
            <CloudBack style = {{top: "42%", animationDuration: "27s"}} />
            <CloudFront style = {{bottom: "16%", animationDuration: "25s"}}/>
            <Cloud style = {{bottom: "3%", animationDuration: "18s"}} />
        </div>
    )
}

export default Background;
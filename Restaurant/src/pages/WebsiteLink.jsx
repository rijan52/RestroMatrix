import React from "react";
import { useParams } from "react-router-dom";

const WebsiteLink = () => {
    const { restaurantId } = useParams();
    const url = `http://localhost:5173/restaurant/${restaurantId}`;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(url);
            alert("Link copied to clipboard!");
        } catch (err) {
            alert("Failed to copy link");
        }
    };

    const handleVisit = () => {
        window.open(url, "_blank");
    };

    return (
        <div style={{ maxWidth: 500, margin: "40px auto", padding: 24, border: "1px solid #eee", borderRadius: 12, textAlign: "center" }}>
            <h2>Website Link</h2>
            <p style={{ wordBreak: "break-all", fontSize: 18, margin: "24px 0" }}>{url}</p>
            <button onClick={handleCopy} style={{ marginRight: 16, padding: "8px 18px", fontSize: 16 }}>Copy</button>
            <button onClick={handleVisit} style={{ padding: "8px 18px", fontSize: 16 }}>Visit</button>
        </div>
    );
};

export default WebsiteLink;

import React, { useState } from "react";
import { useParams } from "react-router-dom";
import "./WebsiteLink.css";

const WebsiteLink = () => {
    const { restaurantId } = useParams();
    const [showSuccess, setShowSuccess] = useState(false);
    const url = `http://localhost:5173/restaurant/${restaurantId}`;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(url);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 2000);
        } catch (err) {
            alert("Failed to copy link");
        }
    };

    const handleVisit = () => {
        window.open(url, "_blank");
    };

    return (
        <div className="website-link-container">
            <div className="website-link-card">
                <div className="website-link-header">
                    <h2>Website Link</h2>
                    <p className="website-link-subtitle">
                        Share this link with your customers to access your restaurant
                    </p>
                </div>

                <div className="url-display">
                    <span className="url-label">Your Restaurant URL</span>
                    <div className="url-text">
                        {url}
                    </div>
                </div>

                <div className="website-link-actions">
                    <button 
                        onClick={handleCopy} 
                        className="copy-btn"
                        data-tooltip="Copy to clipboard"
                    >
                        Copy Link
                    </button>
                    <button 
                        onClick={handleVisit} 
                        className="visit-btn"
                        data-tooltip="Open in new tab"
                    >
                        Visit Website
                    </button>
                </div>

                {showSuccess && (
                    <div className="copy-success">
                        ✓ Link copied to clipboard!
                    </div>
                )}

                {/* Optional QR Code Section */}
                <div className="qr-code-section">
                    <p className="qr-code-title">Scan to open</p>
                    <div className="qr-code-container">
                        <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(url)}`}
                            alt="QR Code for restaurant website"
                            width="150"
                            height="150"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WebsiteLink;
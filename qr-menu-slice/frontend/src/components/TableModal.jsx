import { useState } from "react";

const TableModal = ({ isOpen, onSubmit }) => {
    const [value, setValue] = useState("");

    if (!isOpen) return null;

    const handleSubmit = (event) => {
        event.preventDefault();
        const trimmed = value.trim();
        if (!trimmed) return;
        onSubmit(trimmed);
    };

    return (
        <div className="modal-backdrop">
            <form className="modal" onSubmit={handleSubmit}>
                <h2>Enter your table number</h2>
                <p className="section-subtitle">
                    This helps the kitchen deliver your order quickly.
                </p>
                <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Table 12"
                    value={value}
                    onChange={(event) => setValue(event.target.value)}
                />
                <div className="modal-actions">
                    <button type="submit" className="primary-btn">
                        Continue
                    </button>
                </div>
            </form>
        </div>
    );
};

export default TableModal;

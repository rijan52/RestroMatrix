import { useContext, useMemo, useState } from "react";
import { StoreContext } from "../context/StoreContext.jsx";
import MenuItemCard from "../components/MenuItemCard.jsx";

const Menu = () => {
    const { foodList, isLoadingMenu } = useContext(StoreContext);
    const [category, setCategory] = useState("All");

    const categories = useMemo(() => {
        const values = new Set(foodList.map((item) => item.category));
        return ["All", ...values];
    }, [foodList]);

    const filtered = foodList.filter((item) => category === "All" || item.category === category);

    return (
        <section>
            <div className="section-header">
                <p className="section-subtitle">Scan, browse, order.</p>
                <h1 className="section-title">Today&apos;s menu</h1>
                <p className="section-subtitle">
                    Every plate is cooked to order and served at your table.
                </p>
            </div>

            <div className="category-row">
                {categories.map((item) => (
                    <button
                        key={item}
                        className={`category-pill ${category === item ? "active" : ""}`}
                        onClick={() => setCategory(item)}
                    >
                        {item}
                    </button>
                ))}
            </div>

            {isLoadingMenu ? (
                <p className="section-subtitle">Loading menu...</p>
            ) : (
                <div className="menu-grid">
                    {filtered.map((item) => (
                        <MenuItemCard key={item._id} item={item} />
                    ))}
                </div>
            )}
        </section>
    );
};

export default Menu;

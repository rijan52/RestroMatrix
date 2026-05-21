import React, { useState } from "react";
import { Link, useParams } from "react-router-dom";
import "./Menu.css";
import ExploreMenu from "../../components/ExploreMenu/ExploreMenu";
import FoodDisplay from "../../components/FoodDisplay/FoodDisplay";

const Menu = () => {
    const [category, setCategory] = useState("All");
    const { restaurantId } = useParams();

    return (
        <section className="menu-page">
            <div className="menu-hero">
                <div className="menu-hero-text">
                    <p className="menu-kicker">Full menu</p>
                    <h1>Bold flavors, crafted daily</h1>
                    <p className="menu-lead">
                        Explore our curated categories, seasonal specials, and chef-driven favorites. Each dish is prepared
                        with fresh ingredients and a focus on balance.
                    </p>
                    <div className="menu-badges">
                        <span>Fresh ingredients</span>
                        <span>Chef curated</span>
                        <span>Local favorites</span>
                    </div>
                </div>
                <div className="menu-hero-card">
                    <div>
                        <p className="menu-card-title">Dining Hours</p>
                        <p className="menu-card-value">Sun - Thu</p>
                        <p className="menu-card-muted">11:00 AM - 10:00 PM</p>
                        <p className="menu-card-value">Fri - Sat</p>
                        <p className="menu-card-muted">11:00 AM - 11:30 PM</p>
                    </div>
                    <Link to={`/restaurant/${restaurantId}/reservation`} className="menu-cta">
                        Reserve a table
                    </Link>
                </div>
            </div>

            <div className="menu-content">
                <ExploreMenu category={category} setCategory={setCategory} restaurantId={restaurantId} />
                <FoodDisplay category={category} restaurantId={restaurantId} />
            </div>
        </section>
    );
};

export default Menu;

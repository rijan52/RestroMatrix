import React, { useState, useEffect, useContext } from 'react'
import './ExploreMenu.css'
import { StoreContext } from '../../context/StoreContext'
import axios from 'axios'

const ExploreMenu = ({ category, setCategory }) => {
    const { url } = useContext(StoreContext)
    const [categories, setCategories] = useState([])

    useEffect(() => {
        fetchCategories()
    }, [url])

    const fetchCategories = async () => {
        try {
            const response = await axios.get(`${url}/api/category/list`)
            if (response.data.success) {
                setCategories(response.data.data)
            }
        } catch (error) {
            console.error("Error fetching categories:", error)
        }
    }

    return (
        <div className='explore-menu' id='explore-menu'>
            <h1>Explore Our Menu</h1>
            <p className='explore-menu-text'>
                Lorem, ipsum dolor sit amet consectetur adipisicing elit. Sequi dignissimos quasi, mollitia recusandae at magnam iste, inventore debitis perferendis vel magni in? Rerum aliquam modi maxime vitae cupiditate sapiente commodi?
            </p>
            <div className='explore-menu-list'>
                {categories.map((item) => {
                    return (
                        <div onClick={() => setCategory(prev => prev === item.name ? "All" : item.name)} key={item._id} className='explore-menu-list-item'>
                            <img className={category === item.name ? "active" : ""} src={`${url}/images/${item.image}`} alt={item.name} />
                            <p>{item.name}</p>

                        </div>
                    )
                })}
            </div>
            <hr />
        </div>
    )
}

export default ExploreMenu
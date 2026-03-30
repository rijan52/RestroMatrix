
import React, { useState } from 'react'
import './Home.css'
import Header from '../../components/Header/Header'
import ExploreMenu from '../../components/ExploreMenu/ExploreMenu'
import FoodDisplay from '../../components/FoodDisplay/FoodDisplay'
import { useParams } from 'react-router-dom'

const Home = () => {
  const [category, setCategory] = useState("All");
  const { restaurantId } = useParams();
  return (
    <div>
      <Header />
      <ExploreMenu category={category} setCategory={setCategory} restaurantId={restaurantId} />
      <FoodDisplay category={category} restaurantId={restaurantId} />
    </div>
  )
}

export default Home
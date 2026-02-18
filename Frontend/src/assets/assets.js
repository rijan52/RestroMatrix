

import logo from "./logo.png";
import searchIcon from "./search-icon.png";
import basketIcon from "./basket-icon.png";
import tempLogo from "./temp-logo.png";
import addIcon from "./add-icon.png"
import removeIcon from "./remove-icon.png"
import facebookIcon from "./facebook-icon.png"
import twitterIcon from "./twitter-icon.png"
import whatsappIcon from "./whatsapp-icon.png"
import crossIcon from "./cross-icon.png"
import parcelIcon from "./parcel-icon.png"


import food1 from "./food1.jpg"
import food2 from "./food2.jpg"
import food3 from "./food3.jpg"

const assets = {
  logo,
  searchIcon,
  basketIcon,
  tempLogo,
  food1,
  food2,
  food3,
  addIcon,
  removeIcon,
  facebookIcon, 
  twitterIcon,
  whatsappIcon,
  crossIcon,
  parcelIcon
}

export const menu_list = [
    {
        menu_name:"Salad", 
        menu_image: food1
    },
     {
        menu_name:"Fried", 
        menu_image: food3
    },
     {
        menu_name:"Salad", 
        menu_image: food1
    },
     {
        menu_name:"Fried", 
        menu_image: food3
    }
]

export const food_list =[
    {
        _id: "1",
        name: "Greek salad",
        image: food1,
        price: 12,
        description: "Food provides essential nutrients for overall health",
        category: "Salad"
    },
    {
        _id: "2",
        name: "Chicken Fried",
        image: food1,
        price: 15,
        description: "Food provides essential nutrients for overall health",
        category: "Fried"
    },{
        _id: "3",
        name: "Prawan",
        image: food2,
        price: 16,
        description: "Food provides essential nutrients for overall health",
        category: "Salad"
    },
    {
        _id: "4",
        name: "Chips",
        image: food2,
        price: 16,
        description: "Food provides essential nutrients for overall health",
        category: "Salad"
    }
]
export default assets;

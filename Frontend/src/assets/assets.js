

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


import appetizers from "./appetizers.jpg"
import food2 from "./food2.jpg"
import food3 from "./food3.jpg"

const assets = {
    logo,
    searchIcon,
    basketIcon,
    tempLogo,
    appetizers,
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
        menu_name: "Appetizer",
        menu_image: appetizers
    },
    {
        menu_name: "Fried Items",
        menu_image: food3
    },
    {
        menu_name: "Noodles",
        menu_image: food2
    },
    {
        menu_name: "Chilly Items",
        menu_image: appetizers
    },
    {
        menu_name: "Cheesy",
        menu_image: food2
    },
    {
        menu_name: "Main Course",
        menu_image: food3
    },
    {
        menu_name: "Salad",
        menu_image: appetizers
    },
    {
        menu_name: "Dessert",
        menu_image: food2
    }
]



export default assets;

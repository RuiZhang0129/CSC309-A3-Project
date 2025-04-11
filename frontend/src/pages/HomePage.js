import React from "react";
import "./css/HomePage.css";
import { useNavigate } from 'react-router-dom';
import bowImage from "./image/bow.png";//[1] 58pic, “Bow drawn clipart transparent PNG HD, hand drawn wind cute cartoon bow, Childrens Day, six one, Bow PNG image for free download,” Pngtree, https://pngtree.com/freepng/hand-drawn-wind-cute-cartoon-bow_5469614.html (accessed Apr. 9, 2025). 
import kuromiImage from "./image/kuromi.png";//[2] Gstatic.com, 2025. https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTv21bk9OXFns-gOWsj6eA0m57S-pPptWnxoA&s (accessed Apr. 10, 2025).
import image2 from "./image/image2.png";//[3] Douyin, "Image found via Douyin search", Douyin, https://p3-pc-sign.douyinpic.com/tos-cn-i-0813/8600ad027f2b47e48eb534a35ca95b78~tplv-dy-aweme-images:q75.webp?biz_tag=aweme_images&from=327834062&lk3s=138a59ce&s=PackSourceEnum_SEARCH&sc=image&se=false&x-expires=1746799200&x-signature=pEYbxnFIfFLndBlHnsA0pKcAESc%3D (accessed: Apr. 9, 2025).
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export default function HomePage() {
  const navigate = useNavigate();
  return (
    <div className="home-container">
      <img src={bowImage} alt="Bow" className="corner-bow" />

      <img src={kuromiImage} alt="Kuromi" className="corner-deco top-right" />

      <img src={image2} alt="Cute friend" className="corner-deco bottom-left" />

      <header className="home-header">
        <h1>Welcome to the Hello Kitty World!</h1>
        <p>Explore the cutest world filled with friendship and fun 💖</p>
        <img
          src="https://upload.wikimedia.org/wikipedia/en/0/05/Hello_kitty_character_portrait.png"
          alt="Hello Kitty"
          className="hello-img"
          //[4]Wikimedia.org, 2025. https://upload.wikimedia.org/wikipedia/en/0/05/Hello_kitty_character_portrait.png (accessed Apr. 10, 2025).
        />
        <div className="button-group">
          <button className="pink-btn" onClick={() => navigate("/login")}>
            login
          </button>
        </div>
      </header>
    </div>
  );
}
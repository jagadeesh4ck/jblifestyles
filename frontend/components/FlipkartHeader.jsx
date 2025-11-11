import React from 'react';
import Link from 'next/link';
import '../styles/flipkart.css';

export default function FlipkartHeader() {
  return (
    <header className="fk-header">
      <div className="fk-top">
        <div className="fk-left">
          <Link href="/">
            <a className="fk-logo">JB Lifestyles</a>
          </Link>
        </div>
        <div className="fk-search">
          <input placeholder="Search for products, brands and more" />
        </div>
        <div className="fk-right">
          <Link href="/account"><a className="fk-link">Login</a></Link>
          <Link href="/cart"><a className="fk-cart">Cart</a></Link>
        </div>
      </div>
      <nav className="fk-nav">
        <ul>
          <li><Link href="/category/mobiles">Mobiles</Link></li>
          <li><Link href="/category/electronics">Electronics</Link></li>
          <li><Link href="/category/fashion">Fashion</Link></li>
          <li><Link href="/category/home">Home</Link></li>
          <li><Link href="/category/beauty">Beauty</Link></li>
          <li><Link href="/category/kitchen">Kitchen</Link></li>
        </ul>
      </nav>
    </header>
  );
}
import React from "react";
import Header from "./Header";
import Footer from "./Footer";
import "./MainLayout.css";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="main-layout">
      <Header />
      <main className="main-layout-main">
        {children}
      </main>
      <Footer />
    </div>
  );
}


import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

const Layout = () => {
  const location = useLocation();
  const isHeroTheme = [
    '/',
    '/about',
    '/services',
    '/contact',
    '/citizen/login',
    '/authority/login',
    '/staff/login',
    '/register'
  ].includes(location.pathname);

  return (
    <div className={`d-flex flex-column min-vh-100 ${isHeroTheme ? 'civic-home-layout' : 'civic-page-layout'}`}>
      <Header />
      <main className="flex-grow-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;


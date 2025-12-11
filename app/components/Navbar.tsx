'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { SignInButton, SignUpButton, UserButton, SignedIn, SignedOut } from '@clerk/nextjs';
import styles from './Logo.module.css';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { userId } = useAuth();
  const { user } = useUser();

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      setScrolled(isScrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!userId) return;
    
    // Check if user is admin
    checkAdminStatus();
  }, [userId]);

  const checkAdminStatus = async () => {
    try {
      const response = await fetch('/api/admin/check');
      const data = await response.json();
      setIsAdmin(data.isAdmin);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    }
  };

  return (
    <nav role="navigation" aria-label="Main navigation" className={`fixed w-full z-50 transition-all duration-300 ${
      scrolled ? 'bg-gray-900/95 backdrop-blur-md shadow-lg py-1' : 'bg-black/20 backdrop-blur-sm py-2'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          {/* Circular Logo with Animations */}
          <Link href="/" className={styles.logoContainer}>
            <div className={`${styles.logoWrapper} relative w-12 h-12 md:w-14 md:h-14`}>
              <div className={`absolute inset-0 rounded-full ${
                scrolled ? 'bg-white/10' : 'bg-white/5'
              } backdrop-blur-sm`} />
              <Image
                src="/images/image.webp"
                alt="RovArt Logo"
                fill
                className={`${styles.logoImage} object-cover rounded-full`}
                priority
                sizes="(max-width: 768px) 48px, 56px"
                style={{
                  filter: scrolled 
                    ? 'brightness(1.2)' 
                    : 'drop-shadow(0 0 10px rgba(255,255,255,0.3))'
                }}
              />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {[
              { name: 'Home', href: '/' },
              { name: 'Services', href: '/#services' },
              { name: 'About', href: '/about' },
              { name: 'Contact', href: '/contact' },
            ].map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  scrolled
                    ? 'text-white hover:text-white hover:bg-white/10'
                    : 'text-white hover:text-white hover:bg-white/20'
                }`}
              >
                {item.name}
              </Link>
            ))}
            
            {/* Authentication Buttons */}
            <div className="flex items-center space-x-2 ml-4">
              <SignedOut>
                <SignInButton mode="modal">
                  <button className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    scrolled
                      ? 'text-white hover:text-white hover:bg-white/10'
                      : 'text-white hover:text-white hover:bg-white/20'
                  }`}>
                    Sign In
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 transform hover:scale-105 ${
                    scrolled
                      ? 'bg-white text-gray-900 hover:bg-white/90'
                      : 'bg-white text-gray-900 hover:bg-white/90'
                  }`}>
                    Sign Up
                  </button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                      scrolled
                        ? 'text-white hover:text-white hover:bg-red-500/20'
                        : 'text-white hover:text-white hover:bg-red-500/20'
                    }`}
                    title="Admin Dashboard"
                  >
                    🔐 Admin
                  </Link>
                )}
                <Link
                  href="/dashboard"
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    scrolled
                      ? 'text-white hover:text-white hover:bg-white/10'
                      : 'text-white hover:text-white hover:bg-white/20'
                  }`}
                >
                  Dashboard
                </Link>
                <UserButton 
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: "w-9 h-9"
                    }
                  }}
                />
              </SignedIn>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
              className={`p-2 rounded-full transition-colors duration-300 ${
                scrolled
                  ? 'text-white hover:text-white hover:bg-white/10'
                  : 'text-white hover:text-white hover:bg-white/20'
              }`}
            >
              <svg
                className="h-6 w-6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMenuOpen ? (
                  <path d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          id="mobile-menu"
          aria-hidden={!isMenuOpen}
          className={`md:hidden transition-all duration-300 ease-in-out ${
            isMenuOpen
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 -translate-y-4 pointer-events-none'
          }`}
        >
          <div className="px-2 pt-2 pb-3 space-y-1 bg-gray-900/95 backdrop-blur-md rounded-2xl mt-4 shadow-xl">
            {[
              { name: 'Home', href: '/' },
              { name: 'Services', href: '/#services' },
              { name: 'About', href: '/about' },
              { name: 'Contact', href: '/contact' },
              { name: 'Dashboard', href: '/dashboard', signedIn: true },
            ].map((item) => (
              (!item.signedIn || (item.signedIn)) && (
                <Link
                  key={item.name}
                  href={item.href}
                  className="block px-4 py-3 text-white hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              )
            ))}
            {isAdmin && (
              <Link
                href="/admin"
                className="block px-4 py-3 text-white hover:text-white hover:bg-red-500/20 rounded-xl transition-all duration-300 font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                🔐 Admin Dashboard
              </Link>
            )}
            <div className="px-4 py-3">
              <SignedOut>
                <div className="space-y-2">
                  <SignInButton mode="modal">
                    <button className="block w-full px-4 py-3 text-white hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300 text-center">
                      Sign In
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button className="block w-full px-4 py-3 bg-white text-gray-900 text-center rounded-xl hover:bg-white/90 transition-colors duration-300 shadow-md hover:shadow-lg">
                      Sign Up
                    </button>
                  </SignUpButton>
                </div>
              </SignedOut>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
} 
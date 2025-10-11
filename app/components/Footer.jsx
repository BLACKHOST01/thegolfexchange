import React from 'react';
import { EnvelopeIcon, PhoneIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { GithubIcon, LinkedInIcon, TwitterIcon } from './ui/SocialIcons'; // optional or replace with golf socials
import Link from 'next/link';

const Footer = () => {
  return (
    <footer className=" ">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-12">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* About Column */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white">About The Golf Exchange</h3>
            <p className="text-gray-400">
              The Golf Exchange connects players, coaches, and enthusiasts through top-quality gear, expert advice, and an active golfing community.
            </p>
            <div className="flex items-center gap-2">
              <EnvelopeIcon className="w-5 h-5" />
              <span>
                <a href="mailto:support@thegolfexchange.com">support@thegolfexchange.com</a>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <PhoneIcon className="w-5 h-5" />
              <span>
                <a href="tel:+2348000000000">+234 (800) 000-0000</a>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPinIcon className="w-5 h-5" />
              <span>Lagos, Nigeria</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white">Quick Links</h3>
            <nav className="flex flex-col space-y-2">
              <Link href="/shop" className="hover:text-yellow-400 transition-colors">Shop</Link>
              <Link href="/tournaments" className="hover:text-yellow-400 transition-colors">Tournaments</Link>
              <Link href="/coaching" className="hover:text-yellow-400 transition-colors">Coaching</Link>
              <Link href="/contact" className="hover:text-yellow-400 transition-colors">Contact</Link>
            </nav>
          </div>

          {/* Social Links */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white">Stay Connected</h3>
            <p className="text-gray-400">Follow us for the latest golf tips, gear updates, and event news.</p>
            <div className="flex space-x-4">
              <a href="https://twitter.com/thegolfexchange" target="_blank" rel="noopener noreferrer" className="hover:text-yellow-400 transition-colors">
                <TwitterIcon className="w-6 h-6" />
              </a>
              <a href="https://www.linkedin.com/company/thegolfexchange" target="_blank" rel="noopener noreferrer" className="hover:text-yellow-400 transition-colors">
                <LinkedInIcon className="w-6 h-6" />
              </a>
              <a href="https://github.com/thegolfexchange" target="_blank" rel="noopener noreferrer" className="hover:text-yellow-400 transition-colors">
                <GithubIcon className="w-6 h-6" />
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-green-800 pt-8 text-sm text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} The Golf Exchange. All rights reserved.</p>
          <p className="mt-2">Powered by Next.js & Tailwind CSS</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

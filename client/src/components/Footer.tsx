import React, { useState } from 'react';
import { Heart, Mail, Github, Twitter, Shield, FileText, Scale } from 'lucide-react';
import LegalModals from './LegalModals';

export default function Footer() {
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isLegalOpen, setIsLegalOpen] = useState(false);

  return (
    <>
      <footer className="bg-gray-900 text-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-xl font-bold mb-4">Upload You Clips</h3>
              <p className="text-gray-300 mb-4 max-w-md">
                Transform your long-form videos into engaging short clips with AI-powered processing. 
                Perfect for social media, marketing, and content creation.
              </p>
              <div className="flex items-center space-x-1 text-gray-300">
                <span>Made with</span>
                <Heart className="w-4 h-4 text-red-500" />
                <span>for content creators</span>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#features" className="text-gray-300 hover:text-white transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="text-gray-300 hover:text-white transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#support" className="text-gray-300 hover:text-white transition-colors">
                    Support
                  </a>
                </li>
                <li>
                  <a href="#blog" className="text-gray-300 hover:text-white transition-colors">
                    Blog
                  </a>
                </li>
              </ul>
            </div>

            {/* Connect */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Connect</h4>
              <div className="space-y-2">
                <a
                  href="mailto:support@uploadyouclips.com"
                  className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  <span>support@uploadyouclips.com</span>
                </a>
                <div className="flex space-x-4 mt-4">
                  <a
                    href="https://github.com"
                    className="text-gray-300 hover:text-white transition-colors"
                    aria-label="GitHub"
                  >
                    <Github className="w-5 h-5" />
                  </a>
                  <a
                    href="https://twitter.com"
                    className="text-gray-300 hover:text-white transition-colors"
                    aria-label="Twitter"
                  >
                    <Twitter className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-gray-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-300 text-sm mb-4 md:mb-0">
              © 2024 Upload You Clips. All rights reserved.
            </div>

            {/* Legal Links */}
            <div className="flex space-x-6 text-sm">
              <button
                onClick={() => setIsPrivacyOpen(true)}
                className="flex items-center space-x-1 text-gray-300 hover:text-white transition-colors"
              >
                <Shield className="w-4 h-4" />
                <span>Privacy Policy</span>
              </button>
              <button
                onClick={() => setIsTermsOpen(true)}
                className="flex items-center space-x-1 text-gray-300 hover:text-white transition-colors"
              >
                <FileText className="w-4 h-4" />
                <span>Terms of Service</span>
              </button>
              <button
                onClick={() => setIsLegalOpen(true)}
                className="flex items-center space-x-1 text-gray-300 hover:text-white transition-colors"
              >
                <Scale className="w-4 h-4" />
                <span>Legal</span>
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Legal Modals */}
      <LegalModals
        isTermsOpen={isTermsOpen}
        isPrivacyOpen={isPrivacyOpen}
        isLegalOpen={isLegalOpen}
        onCloseTerms={() => setIsTermsOpen(false)}
        onClosePrivacy={() => setIsPrivacyOpen(false)}
        onCloseLegal={() => setIsLegalOpen(false)}
      />
    </>
  );
}

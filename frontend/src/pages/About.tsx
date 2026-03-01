import React from 'react';
import { useTranslation } from 'react-i18next';

const About: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f6d8d8] to-[#5a9be7] py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="font-playfair text-5xl md:text-6xl font-bold text-white mb-6">
              About ONEDAY
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Your trusted partner in creating unforgettable wedding experiences
            </p>
          </div>

          {/* Main Content */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 md:p-12 mb-8">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="font-playfair text-3xl font-semibold text-white mb-6">
                  Our Story
                </h2>
                <p className="text-white/90 mb-4 leading-relaxed">
                  ONEDAY was born from a simple belief: every couple deserves their perfect wedding day. 
                  We understand that planning a wedding can be overwhelming, which is why we've created 
                  a platform that connects you with the best wedding vendors and services.
                </p>
                <p className="text-white/90 leading-relaxed">
                  From photographers who capture your precious moments to venues that set the perfect 
                  scene, we bring together everything you need to make your special day truly magical.
                </p>
              </div>
              <div className="text-center">
                <div className="bg-white/20 rounded-full w-48 h-48 mx-auto flex items-center justify-center">
                  <svg className="w-24 h-24 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-center">
              <div className="bg-[#d4af37] rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="font-playfair text-xl font-semibold text-white mb-2">Easy Search</h3>
              <p className="text-white/80 text-sm">
                Find the perfect vendors with our advanced search and filtering system
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-center">
              <div className="bg-[#d4af37] rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-playfair text-xl font-semibold text-white mb-2">Verified Vendors</h3>
              <p className="text-white/80 text-sm">
                All our vendors are carefully vetted to ensure quality and reliability
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-center">
              <div className="bg-[#d4af37] rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="font-playfair text-xl font-semibold text-white mb-2">Personal Support</h3>
              <p className="text-white/80 text-sm">
                Our team is here to help you every step of the way to your perfect day
              </p>
            </div>
          </div>

          {/* Contact */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 text-center">
            <h2 className="font-playfair text-3xl font-semibold text-white mb-4">
              Ready to Start Planning?
            </h2>
            <p className="text-white/90 mb-6">
              Join thousands of couples who have found their perfect wedding vendors through ONEDAY
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => window.location.href = '/categories'}
                className="bg-[#d4af37] hover:bg-[#b48a3b] text-white px-8 py-3 rounded-lg font-semibold transition-colors"
              >
                Browse Vendors
              </button>
              <button 
                onClick={() => window.location.href = '/register'}
                className="bg-white/20 hover:bg-white/30 text-white px-8 py-3 rounded-lg font-semibold transition-colors border border-white/30"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;

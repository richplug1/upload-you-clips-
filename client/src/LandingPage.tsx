import React, { useState } from 'react';
import { Play, Upload, Sparkles, Zap, Globe, CheckCircle, ArrowRight, Star, Video, Scissors, Download, Clock, Shield, Heart, BookOpen } from 'lucide-react';
import AuthModal from './components/AuthModal';

interface LandingPageProps {
  onGetStarted?: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLearnMore = () => {
    // Scroll to features section to show more information
    const featuresSection = document.querySelector('#features-section');
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    // After successful authentication, proceed to the app
    if (onGetStarted) {
      onGetStarted();
    }
  };

  const handleGetStarted = () => {
    if (isAuthenticated) {
      onGetStarted?.();
    } else {
      setShowAuthModal(true);
    }
  };

  const features = [
    {
      icon: <Zap className="w-7 h-7" />,
      title: "AI-Powered Editing",
      description: "Advanced algorithms automatically identify the best moments and create engaging clips",
      gradient: "from-yellow-400 via-orange-500 to-red-500",
      bgGradient: "from-yellow-50 via-orange-50 to-red-50",
      iconBg: "from-yellow-100 via-orange-100 to-red-100"
    },
    {
      icon: <Globe className="w-7 h-7" />,
      title: "Multi-Platform Ready",
      description: "Generate clips optimized for YouTube, TikTok, Instagram, and Twitter",
      gradient: "from-blue-400 via-purple-500 to-indigo-600",
      bgGradient: "from-blue-50 via-purple-50 to-indigo-50",
      iconBg: "from-blue-100 via-purple-100 to-indigo-100"
    },
    {
      icon: <Sparkles className="w-7 h-7" />,
      title: "Auto Subtitles",
      description: "AI-generated subtitles increase engagement by 80% across all platforms",
      gradient: "from-emerald-400 via-teal-500 to-cyan-600",
      bgGradient: "from-emerald-50 via-teal-50 to-cyan-50",
      iconBg: "from-emerald-100 via-teal-100 to-cyan-100"
    },
    {
      icon: <Video className="w-7 h-7" />,
      title: "Smart Cropping",
      description: "Automatically crop and frame your content for maximum visual impact",
      gradient: "from-pink-400 via-rose-500 to-red-500",
      bgGradient: "from-pink-50 via-rose-50 to-red-50",
      iconBg: "from-pink-100 via-rose-100 to-red-100"
    },
    {
      icon: <Clock className="w-7 h-7" />,
      title: "Lightning Fast",
      description: "Process videos in seconds, not hours. Get your clips ready instantly",
      gradient: "from-violet-400 via-purple-500 to-indigo-600",
      bgGradient: "from-violet-50 via-purple-50 to-indigo-50",
      iconBg: "from-violet-100 via-purple-100 to-indigo-100"
    },
    {
      icon: <Shield className="w-7 h-7" />,
      title: "Secure & Private",
      description: "Your content is protected with enterprise-grade security and privacy",
      gradient: "from-slate-400 via-gray-500 to-zinc-600",
      bgGradient: "from-slate-50 via-gray-50 to-zinc-50",
      iconBg: "from-slate-100 via-gray-100 to-zinc-100"
    }
  ];

  const stats = [
    { number: "50K+", label: "Clips Generated" },
    { number: "99%", label: "User Satisfaction" },
    { number: "10x", label: "Faster Editing" },
    { number: "15+", label: "Languages Supported" }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Content Creator",
      avatar: "SC",
      content: "This tool transformed my workflow. I can now create a week's worth of content in just one hour!"
    },
    {
      name: "Marcus Johnson",
      role: "Marketing Manager",
      avatar: "MJ",
      content: "The AI understands what makes content viral. Our engagement rates increased by 300%."
    },
    {
      name: "Elena Rodriguez",
      role: "YouTuber",
      avatar: "ER",
      content: "Perfect for repurposing long-form content. The quality is consistently amazing."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="relative z-10 px-4 py-6">
        <div className="container mx-auto max-w-7xl">
          <nav className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Play className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                ClipGenius
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">U</span>
                  </div>
                  <button 
                    onClick={onGetStarted}
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium">
                    Dashboard
                  </button>
                </div>
              ) : (
                <>
                  <button 
                    onClick={() => setShowAuthModal(true)}
                    className="px-4 py-2 text-gray-700 hover:text-blue-600 transition-colors duration-200 font-medium">
                    Sign In
                  </button>
                  <button 
                    onClick={() => setShowAuthModal(true)}
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium">
                    Get Started Free
                  </button>
                </>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-4 py-20">
        <div className="container mx-auto max-w-7xl text-center">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 mb-8 border border-gray-200">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-medium text-gray-700">Trusted by 50K+ creators worldwide</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Transform Videos
              </span>
              <br />
              <span className="text-gray-900">Into Viral Clips</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-12 leading-relaxed">
              AI-powered video editing that automatically creates engaging short clips
              <br />
              optimized for every social media platform
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-16">
              <button 
                onClick={handleGetStarted}
                className="group w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white rounded-2xl hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-2xl transform hover:-translate-y-1 flex items-center justify-center space-x-2 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform skew-x-12 translate-x-full group-hover:translate-x-[-200%] transition-transform duration-700 ease-out"></div>
                <Upload className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
                <span>Start Creating Now</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
              </button>
              <button 
                onClick={handleLearnMore}
                className="group w-full sm:w-auto px-8 py-4 bg-white/90 backdrop-blur-sm text-gray-700 rounded-2xl border border-gray-200 hover:bg-white hover:border-purple-300 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center space-x-2">
                <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <BookOpen className="w-4 h-4 text-white" />
                </div>
                <span>Learn More</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="px-4 py-16">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features-section" className="px-4 py-20">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Powerful Features
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to create viral content with minimal effort
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className={`group relative bg-gradient-to-br ${feature.bgGradient} backdrop-blur-sm rounded-3xl p-8 border border-white/30 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:-translate-y-3 cursor-pointer overflow-hidden`}>
                {/* Background decoration */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-white/10 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                
                {/* Icon container */}
                <div className={`relative w-16 h-16 bg-gradient-to-br ${feature.iconBg} rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                  <div className={`w-14 h-14 bg-gradient-to-r ${feature.gradient} rounded-xl flex items-center justify-center text-white shadow-inner`}>
                    {feature.icon}
                  </div>
                  {/* Floating particles effect */}
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping"></div>
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-gray-800 transition-colors duration-300">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">{feature.description}</p>
                
                {/* Bottom decoration */}
                <div className={`absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r ${feature.gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`}></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-4 py-20 bg-white/50">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="text-gray-900">How It</span>
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Works</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Three simple steps to transform your content
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connection Lines with animations */}
            <div className="hidden md:block absolute top-1/2 left-1/3 w-1/3 h-1 bg-gradient-to-r from-blue-400 via-purple-500 to-indigo-600 transform -translate-y-1/2 rounded-full shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-50 animate-pulse"></div>
            </div>
            <div className="hidden md:block absolute top-1/2 right-1/3 w-1/3 h-1 bg-gradient-to-r from-purple-400 via-indigo-500 to-blue-600 transform -translate-y-1/2 rounded-full shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-50 animate-pulse animation-delay-1000"></div>
            </div>
            
            <div className="text-center relative group">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl group-hover:shadow-blue-500/50 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent"></div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-white/30 rounded-full blur-sm group-hover:scale-150 transition-transform duration-700"></div>
                <Upload className="w-12 h-12 text-white relative z-10 group-hover:scale-110 transition-transform duration-300" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform skew-x-12 translate-x-full group-hover:translate-x-[-200%] transition-transform duration-1000"></div>
              </div>
              <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-600 rounded-full absolute -top-2 -right-2 flex items-center justify-center text-white font-bold text-sm shadow-lg">1</div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors duration-300">Upload Video</h3>
              <p className="text-gray-600 group-hover:text-gray-700 transition-colors duration-300">Simply drag and drop your video file or select from your device</p>
            </div>
            
            <div className="text-center relative group">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-500 via-indigo-600 to-blue-700 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl group-hover:shadow-purple-500/50 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent"></div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-white/30 rounded-full blur-sm group-hover:scale-150 transition-transform duration-700"></div>
                <Sparkles className="w-12 h-12 text-white relative z-10 group-hover:scale-110 transition-transform duration-300" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform skew-x-12 translate-x-full group-hover:translate-x-[-200%] transition-transform duration-1000 delay-200"></div>
                {/* Floating sparkles */}
                <div className="absolute top-2 left-2 w-2 h-2 bg-yellow-300 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-bounce"></div>
                <div className="absolute bottom-3 right-3 w-1.5 h-1.5 bg-pink-300 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-bounce animation-delay-300"></div>
              </div>
              <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-indigo-600 rounded-full absolute -top-2 -right-2 flex items-center justify-center text-white font-bold text-sm shadow-lg">2</div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-purple-600 transition-colors duration-300">AI Processing</h3>
              <p className="text-gray-600 group-hover:text-gray-700 transition-colors duration-300">Our AI analyzes your content and identifies the most engaging moments</p>
            </div>
            
            <div className="text-center relative group">
              <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 via-blue-600 to-cyan-700 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl group-hover:shadow-indigo-500/50 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent"></div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-white/30 rounded-full blur-sm group-hover:scale-150 transition-transform duration-700"></div>
                <Download className="w-12 h-12 text-white relative z-10 group-hover:scale-110 transition-transform duration-300" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform skew-x-12 translate-x-full group-hover:translate-x-[-200%] transition-transform duration-1000 delay-500"></div>
                {/* Success indicator */}
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-300">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-400 to-cyan-600 rounded-full absolute -top-2 -right-2 flex items-center justify-center text-white font-bold text-sm shadow-lg">3</div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-indigo-600 transition-colors duration-300">Download Clips</h3>
              <p className="text-gray-600">Get multiple clips optimized for different social media platforms</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-4 py-20">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Loved by Creators
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              See what content creators are saying about ClipGenius
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="group bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm rounded-3xl p-8 border border-white/30 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:-translate-y-2 relative overflow-hidden">
                {/* Background decoration */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-purple-50/30 to-indigo-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-purple-200/20 to-blue-200/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
                
                <div className="flex items-center mb-6 relative z-10">
                  <div className="relative">
                    {/* Avatar with enhanced design */}
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700 rounded-2xl flex items-center justify-center text-white font-bold mr-4 shadow-xl group-hover:shadow-purple-500/50 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                      {testimonial.avatar}
                      <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent rounded-2xl"></div>
                    </div>
                    {/* Status indicator */}
                    <div className="absolute -bottom-1 -right-3 w-4 h-4 bg-green-400 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 group-hover:text-gray-800 transition-colors duration-300">{testimonial.name}</h4>
                    <p className="text-gray-600 text-sm group-hover:text-purple-600 transition-colors duration-300 font-medium">{testimonial.role}</p>
                  </div>
                </div>
                
                {/* Quote decoration */}
                <div className="absolute top-6 right-6 opacity-10 group-hover:opacity-20 transition-opacity duration-500">
                  <div className="w-12 h-12 text-purple-600">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z"/>
                    </svg>
                  </div>
                </div>
                
                <p className="text-gray-700 leading-relaxed italic relative z-10 group-hover:text-gray-800 transition-colors duration-300 text-lg">"{testimonial.content}"</p>
                
                {/* Enhanced star rating */}
                <div className="flex items-center mt-6 relative z-10">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="relative">
                      <Star className="w-5 h-5 text-yellow-400 fill-current group-hover:scale-110 transition-transform duration-300" style={{animationDelay: `${i * 100}ms`}} />
                      <div className="absolute inset-0 bg-yellow-300 rounded-full blur-sm opacity-0 group-hover:opacity-50 transition-opacity duration-500" style={{animationDelay: `${i * 100}ms`}}></div>
                    </div>
                  ))}
                  <span className="ml-2 text-sm text-gray-500 group-hover:text-purple-600 transition-colors duration-300 font-medium">5.0</span>
                </div>
                
                {/* Bottom accent line */}
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-600 to-indigo-700 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-center"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative px-4 py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        
        <div className="container mx-auto max-w-7xl text-center relative z-10">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-3xl mb-6 animate-bounce-subtle">
              <Heart className="w-10 h-10 text-white" />
            </div>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 animate-float">
            <span className="block">Ready to Go</span>
            <span className="block bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-300 bg-clip-text text-transparent">
              Viral?
            </span>
          </h2>
          
          <p className="text-xl text-blue-100 mb-12 max-w-2xl mx-auto leading-relaxed">
            Join <span className="text-yellow-300 font-bold">50,000+</span> creators who are already using 
            <span className="text-white font-bold"> ClipGenius</span> to grow their audience and create viral content
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
            <button 
              onClick={handleGetStarted}
              className="group relative w-full sm:w-auto px-10 py-5 bg-white text-gray-900 rounded-2xl hover:bg-gray-50 transition-all duration-300 font-bold text-lg shadow-2xl hover:shadow-white/25 transform hover:-translate-y-1 flex items-center justify-center space-x-3 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-100/50 to-transparent transform skew-x-12 translate-x-full group-hover:translate-x-[-200%] transition-transform duration-700"></div>
              <div className="relative z-10 flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <Upload className="w-5 h-5 text-white" />
                </div>
                <span>Start Free Trial</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
              </div>
            </button>
            
            <button 
              onClick={handleLearnMore}
              className="group w-full sm:w-auto px-10 py-5 bg-white/20 backdrop-blur-sm text-white rounded-2xl border border-white/30 hover:bg-white/30 hover:border-white/50 transition-all duration-300 font-bold text-lg shadow-lg transform hover:-translate-y-1 flex items-center justify-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-colors duration-300">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span>Learn More</span>
            </button>
          </div>
          
          {/* Trust indicators */}
          <div className="mt-12 flex items-center justify-center space-x-8 text-white/70">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-300" />
              <span className="text-sm">No Credit Card Required</span>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-blue-300" />
              <span className="text-sm">100% Secure</span>
            </div>
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-yellow-300" />
              <span className="text-sm">Instant Setup</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-12 bg-gray-900">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Play className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                ClipGenius
              </span>
            </div>
            <div className="flex items-center space-x-8 text-gray-400">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Support</a>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 ClipGenius. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
};

export default LandingPage;

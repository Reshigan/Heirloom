'use client';

import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin, Heart } from 'lucide-react';

interface FooterLink {
  label: string;
  href: string;
}

interface FooterSection {
  title: string;
  links: FooterLink[];
}

const footerSections: FooterSection[] = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '#features' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'Security', href: '#security' },
      { label: 'Mobile App', href: '#mobile' }
    ]
  },
  {
    title: 'Resources',
    links: [
      { label: 'Help Center', href: '#help' },
      { label: 'Getting Started', href: '#getting-started' },
      { label: 'Family Tree Guide', href: '#guide' },
      { label: 'Blog', href: '#blog' }
    ]
  },
  {
    title: 'Company',
    links: [
      { label: 'About Us', href: '#about' },
      { label: 'Careers', href: '#careers' },
      { label: 'Press', href: '#press' },
      { label: 'Contact', href: '#contact' }
    ]
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '#privacy' },
      { label: 'Terms of Service', href: '#terms' },
      { label: 'Cookie Policy', href: '#cookies' },
      { label: 'GDPR', href: '#gdpr' }
    ]
  }
];

const socialLinks = [
  { icon: Facebook, href: '#facebook', label: 'Facebook' },
  { icon: Twitter, href: '#twitter', label: 'Twitter' },
  { icon: Instagram, href: '#instagram', label: 'Instagram' },
  { icon: Linkedin, href: '#linkedin', label: 'LinkedIn' }
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative z-10 bg-black border-t border-gold/20">
      <div className="container mx-auto px-6 py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-12 mb-12">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-secondary-gradient rounded-xl flex items-center justify-center">
                <span className="text-black font-bold text-2xl">H</span>
              </div>
              <h3 className="text-3xl font-display font-bold text-gold">Heirloom</h3>
            </div>
            <p className="text-gold-400/70 text-lg leading-relaxed mb-6">
              Preserving family memories and connecting generations through innovative 
              digital heritage solutions. Your legacy, secured forever.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-gold/60">
                <Mail className="w-5 h-5" />
                <span>hello@heirloom.com</span>
              </div>
              <div className="flex items-center space-x-3 text-gold/60">
                <Phone className="w-5 h-5" />
                <span>1-800-HEIRLOOM</span>
              </div>
              <div className="flex items-center space-x-3 text-gold/60">
                <MapPin className="w-5 h-5" />
                <span>San Francisco, CA</span>
              </div>
            </div>
          </div>

          {/* Footer Links */}
          {footerSections.map((section) => (
            <div key={section.title} className="lg:col-span-1">
              <h4 className="text-gold font-semibold text-lg mb-4">{section.title}</h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-gold/60 hover:text-gold transition-colors duration-300"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter Signup */}
        <div className="bg-glass-bg backdrop-blur-lg border border-glass-border rounded-2xl p-8 mb-12">
          <div className="max-w-2xl mx-auto text-center">
            <h4 className="text-2xl font-display font-bold text-gold mb-4">
              Stay Connected with Your Heritage
            </h4>
            <p className="text-gold-400/70 mb-6">
              Get tips, stories, and updates on preserving your family legacy.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 bg-black/50 border border-gold/20 rounded-xl text-gold placeholder-gold/40 focus:outline-none focus:border-gold/50 transition-colors duration-300"
              />
              <button className="bg-secondary-gradient text-black px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-all duration-300">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-gold/20 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            {/* Copyright */}
            <div className="text-gold/60 text-center md:text-left">
              <p className="flex items-center justify-center md:justify-start space-x-2">
                <span>© {currentYear} Heirloom. Made with</span>
                <Heart className="w-4 h-4 text-red-500 fill-current" />
                <span>for families worldwide.</span>
              </p>
            </div>

            {/* Social Links */}
            <div className="flex items-center space-x-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="p-2 text-gold/60 hover:text-gold hover:bg-gold-500/10 rounded-xl transition-all duration-300"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Background Decoration */}
      <div className="absolute inset-0 bg-gradient-to-t from-gold/5 to-transparent pointer-events-none" />
    </footer>
  );
}
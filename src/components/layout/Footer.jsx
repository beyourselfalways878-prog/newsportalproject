import React from 'react';
import { Facebook, Twitter, Instagram, Youtube, Rss, Shield, FileText, Mail } from 'lucide-react';
import { motion } from 'framer-motion';

const Footer = ({ currentContent, onNavigate, onSelectCategory }) => {
  if (!currentContent || !currentContent.footer || !currentContent.categories) {
    return null;
  }
  const { siteName, footer, categories } = currentContent;

  const footerLinks = [
    { label: footer.about, action: () => onNavigate('about'), icon: <FileText className="h-4 w-4 mr-2"/> },
    { label: footer.contact, action: () => onNavigate('contact'), icon: <FileText className="h-4 w-4 mr-2"/> },
    { label: footer.privacy, action: () => onNavigate('privacy'), icon: <Shield className="h-4 w-4 mr-2"/> },
    { label: footer.terms, action: () => onNavigate('terms'), icon: <FileText className="h-4 w-4 mr-2"/> },
  ];

  const socialIcons = [
    { icon: <Facebook className="h-5 w-5" />, href: "https://facebook.com/newsindian24x7", label: "Facebook" },
    { icon: <Twitter className="h-5 w-5" />, href: "https://twitter.com/newsindian24x7", label: "Twitter" },
    { icon: <Instagram className="h-5 w-5" />, href: "https://instagram.com/newsindian24x7", label: "Instagram" },
    { icon: <Rss className="h-5 w-5" />, href: "/rss.xml", label: "RSS Feed" },
  ];

  const handleLinkClick = (e, action) => {
    e.preventDefault();
    action();
  };

  const handleCategoryClick = (e, key) => {
    e.preventDefault();
    onSelectCategory(key);
  };

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="bg-card/60 backdrop-blur-lg border-t mt-16 shadow-top"
    >
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

          <div className="lg:col-span-2">
            <p className="text-3xl font-extrabold mb-4 text-primary">{siteName}</p>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
              भारत और दुनिया भर से नवीनतम, विश्वसनीय समाचार और गहन विश्लेषण प्राप्त करें। राजनीति, तकनीक, मनोरंजन और बहुत कुछ — सब एक जगह पर।
            </p>
            <div className="mb-6">
              <p className="font-semibold text-md mb-2 text-foreground">संपर्क करें</p>
              <a href="mailto:divineink@24x7indiannews.online" className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center">
                <Mail className="h-4 w-4 mr-2" />
                divineink@24x7indiannews.online
              </a>
            </div>
            <div className="flex space-x-3">
              {socialIcons.map((social, index) => (
                <motion.a
                  key={index}
                  href={social.href}
                  aria-label={social.label}
                  target={social.href.startsWith('http') ? "_blank" : undefined}
                  rel={social.href.startsWith('http') ? "noopener noreferrer" : undefined}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  {social.icon}
                </motion.a>
              ))}
            </div>
          </div>

          <div>
            <p className="font-semibold text-lg mb-4 text-foreground">मुख्य श्रेणियां</p>
            <ul className="space-y-2.5">
              {Object.entries(categories).slice(1, 6).map(([key, label]) => (
                <li key={key}>
                  <button onClick={(e) => handleCategoryClick(e, key)} className="text-sm text-muted-foreground hover:text-primary hover:underline transition-colors text-left w-full">
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-semibold text-lg mb-4 text-foreground">नियम व शर्तें</p>
            <ul className="space-y-2.5">
              {footerLinks.map((link, index) => (
                 <li key={index}>
                  <button onClick={(e) => handleLinkClick(e, link.action)} className="text-sm text-muted-foreground hover:text-primary hover:underline transition-colors flex items-center text-left w-full">
                    {link.icon}{link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t mt-10 pt-8 text-center">
          <p className="text-xs text-muted-foreground">{footer.copyright.replace('COPYRIGHT', '© ' + new Date().getFullYear())} {siteName}. सर्वाधिकार सुरक्षित।</p>
        </div>
      </div>
    </motion.footer>
  );
};

export default Footer;

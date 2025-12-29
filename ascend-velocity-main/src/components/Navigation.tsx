import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import logo from "@/assets/logo.png";
import { NeonButton } from "./NeonButton";

export const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { to: "/", label: "Início" },
    { to: "/about", label: "Sobre" },
    { to: "/pricing", label: "Planos" },
    { to: "/support", label: "Suporte" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-white/10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <img src={logo} alt="GameTeam" className="h-10 w-auto group-hover:animate-glow" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-foreground/80 hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            <Link to="/login">
              <NeonButton variant="glass">Entrar</NeonButton>
            </Link>
            <Link to="/signup">
              <NeonButton variant="neon">Começar Grátis</NeonButton>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg glass-card"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden py-4 space-y-4 animate-fade-in">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setIsOpen(false)}
                className="block py-2 text-foreground/80 hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <div className="flex flex-col gap-2 pt-4">
              <Link to="/login" onClick={() => setIsOpen(false)}>
                <NeonButton variant="glass" className="w-full">
                  Entrar
                </NeonButton>
              </Link>
              <Link to="/signup" onClick={() => setIsOpen(false)}>
                <NeonButton variant="neon" className="w-full">
                  Começar Grátis
                </NeonButton>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

import { Link } from "react-router-dom";
import { Facebook, Twitter, Linkedin, Instagram } from "lucide-react";
import logo from "@/assets/logo.png";

export const Footer = () => {
  const footerSections = [
    {
      title: "Produto",
      links: [
        { label: "Funcionalidades", to: "/about" },
        { label: "Planos", to: "/pricing" },
        { label: "Atualizações", to: "/" },
      ],
    },
    {
      title: "Empresa",
      links: [
        { label: "Sobre Nós", to: "/about" },
        { label: "Suporte", to: "/support" },
        { label: "Blog", to: "/" },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Privacidade", to: "/" },
        { label: "Termos de Uso", to: "/" },
        { label: "Cookies", to: "/" },
      ],
    },
  ];

  const socialLinks = [
    { icon: Facebook, href: "#" },
    { icon: Twitter, href: "#" },
    { icon: Linkedin, href: "#" },
    { icon: Instagram, href: "#" },
  ];

  return (
    <footer className="border-t border-border glass-card mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <img src={logo} alt="GameTeam" className="h-10 w-auto" />
            </Link>
            <p className="text-muted-foreground mb-6 max-w-xs">
              Transforme o trabalho em jogo. Conquistas, níveis e progressão que motivam sua equipe.
            </p>
            <div className="flex gap-4">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  className="w-10 h-10 rounded-lg glass-card flex items-center justify-center hover:border-neon-blue transition-colors"
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Links Sections */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="font-semibold mb-4">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground text-sm">
            © 2024 GameTeam. Todos os direitos reservados.
          </p>
          <p className="text-muted-foreground text-sm">
            Feito com 💜 para equipes extraordinárias
          </p>
        </div>
      </div>
    </footer>
  );
};

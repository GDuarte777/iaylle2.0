import { motion } from "framer-motion";
import { Star, Quote, User } from "lucide-react";
import { GlassCard } from "./GlassCard";

const testimonials = [
  {
    name: "Ricardo Mendes",
    role: "Gestor de Vendas",
    company: "TechSales",
    content: "A gamificação transformou completamente o engajamento do meu time. As metas agora são desafios empolgantes!",
    rating: 5,
    initials: "RM"
  },
  {
    name: "Fernanda Costa",
    role: "Líder de Marketing",
    company: "CreativeAgency",
    content: "Conseguimos aumentar a produtividade em 40% no primeiro mês. A plataforma é intuitiva e viciante no bom sentido.",
    rating: 5,
    initials: "FC"
  },
  {
    name: "Carlos Eduardo",
    role: "Head de CS",
    company: "SoftSolutions",
    content: "O suporte é incrível e a implementação foi super rápida. Meus analistas adoram competir pelos rankings semanais.",
    rating: 5,
    initials: "CE"
  }
];

export const SocialProof = () => {
  return (
    <section className="py-24 border-t border-white/5 bg-black/40 relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-5xl font-bold mb-6"
          >
            Aprovado por <span className="text-neon-blue">Gestores de Elite</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg text-muted-foreground"
          >
            Veja o que líderes que usam nossa plataforma têm a dizer sobre seus resultados.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <GlassCard className="h-full p-8 flex flex-col hover:border-neon-blue/30 transition-colors">
                <div className="flex gap-1 mb-6">
                  {[...Array(item.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                  ))}
                </div>
                
                <div className="relative flex-1">
                  <Quote className="absolute -top-2 -left-2 w-8 h-8 text-white/10 rotate-180" />
                  <p className="text-lg text-gray-200 leading-relaxed italic relative z-10 pl-4">
                    "{item.content}"
                  </p>
                </div>

                <div className="mt-8 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-neon-blue to-neon-violet flex items-center justify-center text-white font-bold text-lg">
                    {item.initials}
                  </div>
                  <div>
                    <h4 className="font-bold text-white">{item.name}</h4>
                    <p className="text-sm text-muted-foreground">{item.role} na {item.company}</p>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

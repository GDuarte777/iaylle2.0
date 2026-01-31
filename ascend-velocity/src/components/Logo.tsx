
import logoDark from "@/assets/logo-dark-cropped.png";
import logoLight from "@/assets/logo-light.png";

interface LogoProps {
  className?: string;
  alt?: string;
}

export const Logo = ({ className = "", alt = "Guildas" }: LogoProps) => {
  return (
    <>
      <img 
        src={logoLight} 
        alt={alt} 
        className={`dark:hidden block ${className}`} 
      />
      <img 
        src={logoDark} 
        alt={alt} 
        className={`hidden dark:block ${className}`} 
      />
    </>
  );
};

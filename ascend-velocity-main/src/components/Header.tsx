'use client';
import React from 'react';
import { Link } from 'react-router-dom';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MenuToggleIcon } from '@/components/ui/menu-toggle-icon';
import { useScroll } from '@/components/ui/use-scroll';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import logo from '@/assets/logo.png';

export function Header() {
	const [open, setOpen] = React.useState(false);
	const scrolled = useScroll(10);
	const { theme, setTheme } = useTheme();

	const links = [
		{
			label: 'Sobre',
			href: '/about',
		},
		{
			label: 'Planos',
			href: '/pricing',
		},
		{
			label: 'Suporte',
			href: '/support',
		},
	];

	React.useEffect(() => {
		if (open) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = '';
		}

		return () => {
			document.body.style.overflow = '';
		};
	}, [open]);

	return (
		<>
		<header
			className={cn(
				'fixed top-0 left-0 right-0 z-50 border-b border-transparent md:transition-all md:ease-out',
				{
					'bg-background/95 supports-[backdrop-filter]:bg-background/50 border-border backdrop-blur-lg md:shadow':
						scrolled && !open,
					'bg-background/90': open,
				},
			)}
		>
			<div className="mx-auto w-full max-w-5xl md:rounded-md md:border">
				<nav
					className={cn(
						'flex h-14 w-full items-center justify-between px-4 md:h-12 md:transition-all md:ease-out',
						{
							'md:px-2': scrolled,
						},
					)}
				>
			<Link to="/" className="flex items-center gap-2">
				<img src={logo} alt="GameTeam" className="h-8 w-auto" />
			</Link>
				<div className="hidden items-center gap-2 md:flex">
					{links.map((link, i) => (
						<Link key={i} className={buttonVariants({ variant: 'ghost' })} to={link.href}>
							{link.label}
						</Link>
					))}
					<Button
						variant="ghost"
						size="icon"
						onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
					>
						<Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
						<Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
						<span className="sr-only">Toggle theme</span>
					</Button>
					<Link to="/login">
						<Button variant="outline">Entrar</Button>
					</Link>
					<Link to="/signup">
						<Button>Começar</Button>
					</Link>
				</div>
				<Button size="icon" variant="outline" onClick={() => setOpen(!open)} className="md:hidden">
					<MenuToggleIcon open={open} className="size-5" duration={300} />
				</Button>
			</nav>
			</div>
		
			<div
				className={cn(
					'bg-background/90 backdrop-blur-lg fixed top-14 right-0 bottom-0 left-0 z-50 flex flex-col overflow-hidden border-y md:hidden',
					open ? 'block' : 'hidden',
				)}
			>
				<div
					data-slot={open ? 'open' : 'closed'}
					className={cn(
						'data-[slot=open]:animate-in data-[slot=open]:zoom-in-95 data-[slot=closed]:animate-out data-[slot=closed]:zoom-out-95 ease-out',
						'flex h-full w-full flex-col justify-between gap-y-2 p-4',
					)}
				>
					<div className="grid gap-y-2">
						{links.map((link) => (
							<Link
								key={link.label}
								className={buttonVariants({
									variant: 'ghost',
									className: 'justify-start',
								})}
								to={link.href}
								onClick={() => setOpen(false)}
							>
								{link.label}
							</Link>
						))}
						<Button
							variant="ghost"
							className="justify-start"
							onClick={() => {
								setTheme(theme === 'dark' ? 'light' : 'dark');
								setOpen(false);
							}}
						>
							<Sun className="mr-2 h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
							<Moon className="mr-2 absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
							<span className="dark:hidden">Modo Escuro</span>
							<span className="hidden dark:inline">Modo Claro</span>
						</Button>
					</div>
					<div className="flex flex-col gap-2">
						<Link to="/login" onClick={() => setOpen(false)}>
							<Button variant="outline" className="w-full">
								Entrar
							</Button>
						</Link>
						<Link to="/signup" onClick={() => setOpen(false)}>
							<Button className="w-full">Começar</Button>
						</Link>
					</div>
				</div>
			</div>
		</header>
		<div aria-hidden="true" className="h-14 md:h-12"></div>
		</>
	);
}

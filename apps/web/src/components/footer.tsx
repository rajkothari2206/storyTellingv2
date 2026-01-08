import { Facebook, Instagram, Youtube, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Footer() {
	return (
		<footer className="border-t mt-20 bg-muted/30">
			<div className="container mx-auto px-4 md:px-8 py-12">
				<div className="grid grid-cols-1 md:grid-cols-4 gap-8">
					<div className="space-y-4">
						<div className="flex items-center gap-2">
							<Sparkles className="w-8 h-8 text-primary" />
							<div className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
								LalliFafa
							</div>
						</div>
						<p className="text-muted-foreground text-sm leading-relaxed">
							Creating magical, personalized stories for children aged 3+ with Lalli and Fafa.
						</p>
					</div>

					<div>
						<h3 className="font-bold text-lg mb-4">Features</h3>
						<ul className="space-y-2 text-sm text-muted-foreground">
							<li>
								<a href="#" className="hover:text-primary transition-colors" data-testid="link-footer-english-hindi">
									English & Hindi
								</a>
							</li>
							<li>
								<a href="#" className="hover:text-primary transition-colors" data-testid="link-footer-safe-content">
									Safe Content
								</a>
							</li>
							<li>
								<a href="#" className="hover:text-primary transition-colors" data-testid="link-footer-personalized">
									Personalized Stories
								</a>
							</li>
							<li>
								<a href="#" className="hover:text-primary transition-colors" data-testid="link-footer-educational">
									Educational Value
								</a>
							</li>
							<li>
								<a href="#" className="hover:text-primary transition-colors" data-testid="link-footer-shop">
									Shop
								</a>
							</li>
						</ul>
					</div>

					<div>
						<h3 className="font-bold text-lg mb-4">Resources</h3>
						<ul className="space-y-2 text-sm text-muted-foreground">
							<li>
								<a href="/blog" className="hover:text-primary transition-colors" data-testid="link-footer-blog">
									Blog
								</a>
							</li>
							<li className="hover:text-foreground transition-colors cursor-pointer">contact at: raj@lallifafa.com</li>
						</ul>
					</div>

					<div>
						<h3 className="font-bold text-lg mb-4">Connect With Us</h3>
						<div className="space-y-3">
							<Button 
								variant="ghost" 
								className="w-full justify-start gap-3 hover:bg-primary/10"
								data-testid="button-footer-facebook"
							>
								<Facebook className="w-5 h-5 text-blue-600" />
								<span className="text-sm">Facebook</span>
							</Button>
							<Button 
								variant="ghost" 
								className="w-full justify-start gap-3 hover:bg-primary/10"
								data-testid="button-footer-instagram"
							>
								<Instagram className="w-5 h-5 text-pink-600" />
								<span className="text-sm">Instagram</span>
							</Button>
							<a 
								href="https://www.youtube.com/@LalliFafa" 
								target="_blank" 
								rel="noopener noreferrer"
								className="block"
							>
								<Button 
									variant="ghost" 
									className="w-full justify-start gap-3 hover:bg-primary/10"
									data-testid="button-footer-youtube"
								>
									<Youtube className="w-5 h-5 text-red-600" />
									<span className="text-sm">YouTube</span>
								</Button>
							</a>
							<p className="text-xs text-muted-foreground italic mt-4">
								More social links coming soon!
							</p>
						</div>
					</div>
				</div>

				<div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
					<p>© 2025 LalliFafa. All rights reserved. Made with ❤️ for families worldwide.</p>
				</div>
			</div>
		</footer>
	);
}


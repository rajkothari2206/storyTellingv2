import { Heart, Sparkles } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="container mx-auto px-6 py-16">
        <div className="grid md:grid-cols-4 gap-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <img src="/logoNoBg.png" alt="Lalli" className="w-12 h-14" />
            </div>
            <h3 className="font-black text-2xl bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
              LalliFafa
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Creating magical, personalized stories for children aged 3+ with Lalli and Fafa.
            </p>
          </div>
          
          <div>
            <h3 className="font-bold text-lg mb-4">Features</h3>
            <ul className="space-y-3 text-muted-foreground">
              <li className="hover:text-foreground transition-colors cursor-pointer">English & Hindi</li>
              <li className="hover:text-foreground transition-colors cursor-pointer">Safe Content</li>
              <li className="hover:text-foreground transition-colors cursor-pointer">Personalized Stories</li>
              <li className="hover:text-foreground transition-colors cursor-pointer">Educational Value</li>
              <li className="hover:text-foreground transition-colors cursor-pointer">Shop</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold text-lg mb-4">Resources</h3>
            <ul className="space-y-3 text-muted-foreground">
              <li className="hover:text-foreground transition-colors cursor-pointer">Blog</li>
              <li className="hover:text-foreground transition-colors cursor-pointer">contact at: raj@lallifafa.com</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold text-lg mb-4">Connect With Us</h3>
            <div className="space-y-4">
              <a 
                href="https://www.facebook.com/LalLifafa/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-all duration-300 group"
              >
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                  <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </div>
                <span>Facebook</span>
              </a>
              <a 
                href="https://www.instagram.com/lallifafa/" 
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-primary transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                <img width="30" height="30" src="https://img.icons8.com/fluency/48/instagram-new.png" alt="instagram-new"/>
                </div>
                <span>Instagram</span>
              </a>
              <a 
                href="https://www.youtube.com/@LalliFafa"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-primary transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                <img width="30" height="30" src="https://img.icons8.com/fluency/48/youtube-play.png" alt="youtube-play"/>
                </div>
                <span>YouTube</span>
              </a>
              <p className="text-sm text-muted-foreground italic flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                More social links coming soon!
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-border text-center">
          <p className="text-muted-foreground flex items-center justify-center gap-2">
            &copy; 2025 LalliFafa. All rights reserved. Made with <Heart className="w-4 h-4 text-red-500 fill-current" /> for families worldwide.
          </p>
        </div>
      </div>
    </footer>
  );
}


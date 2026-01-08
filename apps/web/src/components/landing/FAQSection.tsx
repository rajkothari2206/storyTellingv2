import { useState } from "react";
import { Card } from "@/components/ui/card";
import { HelpCircle, ChevronDown, ChevronUp, Sparkles, BookOpen, Heart } from "lucide-react";

interface FAQItem {
	question: string;
	answer: string;
}

const faqData: FAQItem[] = [
	{
		question: "What is Lalli Fafa?",
		answer: "Lalli Fafa is an original children's storytelling universe created to boost imagination, early learning, and emotional development through short, engaging stories for young kids."
	},
	{
		question: "Who are Lalli and Fafa?",
		answer: "They are two friendly, adventurous characters who explore new places, solve small problems, and teach children values like kindness, curiosity, and teamwork."
	},
	{
		question: "What age group is Lalli Fafa suitable for?",
		answer: "The stories are created for children aged 3 to 8, with simple vocabulary, gentle themes, and easy-to-follow narratives."
	},
	{
		question: "How do Lalli Fafa stories help with early childhood learning?",
		answer: "Kids develop vocabulary, listening skills, imagination, emotional awareness, and curiosity through story-based learning and character-driven situations."
	},
	{
		question: "Are the stories safe and kid-friendly?",
		answer: "Yes. Lalli Fafa content is designed to be wholesome, positive, and completely free from harmful or age-inappropriate elements."
	},
	{
		question: "How often do you release new stories?",
		answer: "Fresh stories, characters, and learning activities are added regularly so kids always have something new to explore."
	},
	{
		question: "What makes Lalli Fafa different from other kids' stories?",
		answer: "The stories blend Indian cultural warmth with universal themes, simple humor, gentle pacing, and child psychology principles that keep kids engaged without overstimulation."
	},
	{
		question: "How long is each story?",
		answer: "Most stories take 3–5 minutes to read, making them perfect for bedtime, car rides, or quick learning breaks."
	},
	{
		question: "Are Lalli Fafa stories available in multiple languages?",
		answer: "Currently in English and Hindi. Other Indian languages will be added soon."
	},
	{
		question: "Can I use these stories for bedtime reading?",
		answer: "Yes. The stories use calming rhythms and simple imagery, making them ideal for bedtime routines."
	},
	{
		question: "Do you have printable worksheets and activities?",
		answer: "Yes. Coloring pages, activity sheets, and simple learning tasks are being added to help kids connect stories to everyday learning."
	},
	{
		question: "Are Lalli Fafa stories helpful for improving vocabulary?",
		answer: "Definitely. Kids naturally absorb new words and sentence structures through repeated reading and familiar character interactions."
	},
	{
		question: "Can teachers and schools use Lalli Fafa content?",
		answer: "Yes. Stories are suitable for classroom reading, storytelling sessions, creative activities, and language-building exercises."
	},
	{
		question: "Is there a Lalli Fafa mobile app?",
		answer: "The app is under development. All stories and resources are currently available on the website."
	},
	{
		question: "Is the website ad-free and safe for kids?",
		answer: "Yes. The entire experience is ad-free so children can read and explore without distractions."
	},
	{
		question: "Do Lalli Fafa stories reduce screen dependency?",
		answer: "Yes. The stories encourage reading, imagination, and parent-child interaction, making them a healthier alternative to passive screen time."
	},
	{
		question: "Where do the story ideas come from?",
		answer: "Every story is crafted using early learning principles, imaginative play, and insights into how young children understand the world."
	},
	{
		question: "Can parents share stories with friends or online?",
		answer: "You may share links or short excerpts with proper credit. Full-story copying or commercial use is not permitted."
	},
	{
		question: "Is the content useful for improving English or Hindi language skills?",
		answer: "Yes. Repetition, simple grammar, and familiar characters make language learning natural for kids."
	},
	{
		question: "How can I stay updated with new stories and activities?",
		answer: "Follow Lalli Fafa on Facebook and Instagram for notifications about new stories, worksheets, characters, and announcements."
	}
];

function FAQItem({ question, answer, isOpen, onToggle }: FAQItem & { isOpen: boolean; onToggle: () => void }) {
	return (
		<Card 
			className="group relative overflow-hidden bg-card/80 backdrop-blur-sm border-2 hover:border-primary/50 rounded-[20px] transition-all duration-300 hover:shadow-xl"
		>
			<button
				onClick={onToggle}
				className="w-full p-4 md:p-6 text-left flex items-center justify-between gap-4 hover:bg-primary/5 transition-colors duration-300 rounded-[20px]"
			>
				<div className="flex items-start gap-4 flex-1">
					<div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-orange-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-lg">
						<HelpCircle className="w-4 h-4 md:w-5 md:h-5 text-white" />
					</div>
					<h3 className="font-black text-base md:text-lg text-foreground group-hover:text-primary transition-colors duration-300 flex-1">
						{question}
					</h3>
				</div>
				<div className="flex-shrink-0">
					{isOpen ? (
						<ChevronUp className="w-5 h-5 md:w-6 md:h-6 text-primary transition-transform duration-300" />
					) : (
						<ChevronDown className="w-5 h-5 md:w-6 md:h-6 text-muted-foreground group-hover:text-primary transition-all duration-300" />
					)}
				</div>
			</button>
			{isOpen && (
				<div className="px-4 md:px-6 pb-4 md:pb-6 pl-12 md:pl-16 animate-in slide-in-from-top-2 duration-300">
					<p className="text-sm md:text-base text-muted-foreground leading-relaxed">
						{answer}
					</p>
				</div>
			)}
		</Card>
	);
}

export function FAQSection() {
	const [openIndex, setOpenIndex] = useState<number | null>(0);

	const toggleFAQ = (index: number) => {
		setOpenIndex(openIndex === index ? null : index);
	};

	return (
		<section className="py-8 md:py-16 bg-gradient-to-b from-muted/30 via-background to-muted/30 relative overflow-hidden">
			{/* Decorative background elements */}
			<div className="absolute inset-0 -z-10">
				<div className="absolute top-0 left-1/4 w-64 md:w-96 h-64 md:h-96 bg-primary/5 rounded-full blur-3xl"></div>
				<div className="absolute bottom-0 right-1/4 w-64 md:w-96 h-64 md:h-96 bg-chart-2/5 rounded-full blur-3xl"></div>
				<div className="absolute top-1/2 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>
			</div>

			{/* Floating decorative icons */}
			<div className="absolute inset-0 pointer-events-none">
				<div className="hidden md:block absolute top-20 left-10">
					<Sparkles className="w-10 h-10 text-yellow-400 opacity-20 animate-pulse" />
				</div>
				<div className="hidden md:block absolute top-40 right-20">
					<BookOpen className="w-12 h-12 text-blue-400 opacity-20 animate-pulse" style={{ animationDelay: "1s" }} />
				</div>
				<div className="hidden md:block absolute bottom-20 left-1/4">
					<Heart className="w-10 h-10 text-pink-400 opacity-20 animate-pulse" style={{ animationDelay: "2s" }} />
				</div>
			</div>

			<div className="container mx-auto px-4 md:px-6 relative z-10">
				{/* Header */}
				<div className="text-center mb-8 md:mb-12 space-y-3 md:space-y-4">
					<div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-sm md:text-base font-bold text-primary mb-2 md:mb-4">
						<HelpCircle className="w-4 h-4 md:w-5 md:h-5" />
						<span>Frequently Asked Questions</span>
					</div>
					<h1 className="text-4xl md:text-6xl lg:text-7xl font-black">
						<span className="bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 bg-clip-text text-transparent">
							Got Questions?
						</span>
						<br />
						<span className="text-foreground">We've Got Answers!</span>
					</h1>
					<p className="text-base md:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto font-medium">
						Everything you need to know about Lalli Fafa and how we're making storytelling magical for your little ones
					</p>
				</div>

				{/* FAQ Items */}
				<div className="max-w-4xl mx-auto space-y-4 md:space-y-5">
					{faqData.map((faq, index) => (
						<FAQItem
							key={index}
							question={faq.question}
							answer={faq.answer}
							isOpen={openIndex === index}
							onToggle={() => toggleFAQ(index)}
						/>
					))}
				</div>

				{/* Footer CTA */}
				<div className="mt-12 md:mt-16 text-center">
					<div className="inline-block p-6 md:p-8 bg-gradient-to-br from-primary/10 via-chart-2/10 to-chart-3/10 rounded-[30px] backdrop-blur-sm border-2 border-primary/20">
						<p className="text-base md:text-lg text-muted-foreground mb-4 md:mb-6">
							Still have questions? We'd love to hear from you!
						</p>
						<div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
							<a
								href="https://www.facebook.com/LalLifafa/"
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-[25px] font-semibold transition-all duration-300 hover:scale-105 shadow-lg"
							>
								Follow on Facebook
							</a>
							<a
								href="https://www.instagram.com/lallifafa/"
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-[25px] font-semibold transition-all duration-300 hover:scale-105 shadow-lg"
							>
								Follow on Instagram
							</a>
							<a
								href="https://www.youtube.com/@LalliFafa"
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex items-center justify-center px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-[25px] font-semibold transition-all duration-300 hover:scale-105 shadow-lg"
							>
								Follow on YouTube
							</a>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}

import { useState } from "react";
import { useAction, useMutation } from "convex/react";
import { api } from "@story-telling-v2/backend/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { COLORS, ANIMALS } from "@/lib/constants";

export default function 	OnboardingForm() {
	const [currentStep, setCurrentStep] = useState(1);
	const [formData, setFormData] = useState({
		parentName: "",
		childName: "",
		childAge: "",
		childNickName: "",
		childGender: "male" as "male" | "female" | "other",
		favoriteColor: "",
		favoriteAnimal: "",
	});
	const [childPhoto, setChildPhoto] = useState<File | null>(null);
	const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

	const createProfile = useMutation(api.userProfiles.createProfile);
	const generateUploadUrl = useMutation(api.userProfiles.generateProfilePictureUploadUrl);
	const setProfilePicture = useMutation(api.userProfiles.setProfilePicture);
	const generateAndStoreAvatar = useAction(api.userProfiles.generateAndStoreAvatar);
	const navigate = useNavigate();

	const totalSteps = 4;

	const handleNext = () => {
		if (currentStep === 1 && !formData.parentName.trim()) {
			toast.error("Please enter parent's name");
			return;
		}
		if (currentStep === 2 && (!formData.childName.trim() || !formData.childAge || !formData.childNickName.trim())) {
			toast.error("Please fill all fields");
			return;
		}
		setCurrentStep(currentStep + 1);
	};

	const handleBack = () => {
		setCurrentStep(currentStep - 1);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		try {
			await createProfile({
				parentName: formData.parentName,
				childName: formData.childName,
				childAge: parseInt(formData.childAge),
				childGender: formData.childGender,
				childNickName: formData.childNickName,
				favoriteColor: formData.favoriteColor,
				favoriteAnimal: formData.favoriteAnimal,
			});

			// Optional: upload child's photo to storage and store storageId in profile
			if (childPhoto) {
				try {
					setIsUploadingPhoto(true);
					const uploadUrl = await generateUploadUrl({});
					const res = await fetch(uploadUrl, {
						method: "POST",
						headers: { "Content-Type": childPhoto.type || "application/octet-stream" },
						body: childPhoto,
					});
					if (!res.ok) {
						throw new Error("Upload failed");
					}
					const json = (await res.json()) as { storageId?: string };
					if (json?.storageId) {
						await setProfilePicture({ storageId: json.storageId });
						// Trigger avatar generation using the uploaded photo as reference
						try {
							await generateAndStoreAvatar({});
						} catch {
							// Non-blocking: avatar can be generated later
						}
					}
				} catch (_err) {
					toast.error("Photo upload failed. You can add it later in settings.");
				} finally {
					setIsUploadingPhoto(false);
				}
			}

			toast.success("Profile created successfully! Welcome to Lalli Fafa!");
			
			navigate({
				to: "/dashboard",
				replace: true,
			});
		} catch (error) {
			toast.error("Error creating profile. Please try again.");
		}
	};

	const renderStepIndicator = () => {
		return (
			<div className="flex justify-center mb-8">
				<div className="flex gap-2">
					{Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
						<div
							key={step}
							className={`h-2 rounded-full transition-all duration-300 ${
								step === currentStep
									? "w-8 bg-primary"
									: step < currentStep
									? "w-2 bg-primary/50"
									: "w-2 bg-gray-300"
							}`}
						/>
					))}
				</div>
			</div>
		);
	};

	const renderStep1 = () => (
		<div className="space-y-6 animate-fade-in">
			<div className="text-center mb-6">
				<h2 className="text-3xl font-bold text-primary mb-2">Let's Get Started! 👋</h2>
				<p className="text-muted-foreground">First, tell us your name</p>
			</div>
			
			<div>
				<label htmlFor="parentName" className="block text-sm font-medium mb-2">
					Parent's Name
				</label>
				<Input
					id="parentName"
					value={formData.parentName}
					onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
					placeholder="Enter your name"
					className="text-lg py-6"
					autoFocus
				/>
			</div>

			<Button
				onClick={handleNext}
				className="w-full py-6 text-lg font-semibold"
				size="lg"
			>
				Continue →
			</Button>
		</div>
	);

	const renderStep2 = () => (
		<div className="space-y-6 animate-fade-in">
			<div className="text-center mb-6">
				<h2 className="text-3xl font-bold text-primary mb-2">Now, About Your Child</h2>
				<p className="text-muted-foreground">Let's get to know your little one</p>
			</div>
			
			<div>
				<label htmlFor="childName" className="block text-sm font-medium mb-2">
					Child's Name
				</label>
				<Input
					id="childName"
					value={formData.childName}
					onChange={(e) => setFormData({ ...formData, childName: e.target.value })}
					placeholder="Enter child's name"
					className="text-lg py-6"
				/>
			</div>

			<div>
				<label htmlFor="childNickname" className="block text-sm font-medium mb-2">
					Nickname (Optional but fun!)
				</label>
				<Input
					id="childNickname"
					value={formData.childNickName}
					onChange={(e) => setFormData({ ...formData, childNickName: e.target.value })}
					placeholder="e.g., Teddy, Sunny, Star"
					className="text-lg py-6"
				/>
			</div>

			<div>
				<label htmlFor="childAge" className="block text-sm font-medium mb-2">
					Child's Age
				</label>
				<Input
					id="childAge"
					type="number"
					min="1"
					max="18"
					value={formData.childAge}
					onChange={(e) => setFormData({ ...formData, childAge: e.target.value })}
					placeholder="Enter age"
					className="text-lg py-6"
				/>
			</div>

			<div className="flex gap-3 pt-2">
				<Button
					onClick={handleBack}
					variant="outline"
					className="flex-1 py-6 text-lg"
					size="lg"
				>
					← Back
				</Button>
				<Button
					onClick={handleNext}
					className="flex-1 py-6 text-lg font-semibold"
					size="lg"
				>
					Continue →
				</Button>
			</div>
		</div>
	);

	const renderStep3 = () => (
		<div className="space-y-6 animate-fade-in">
			<div className="text-center mb-6">
				<h2 className="text-3xl font-bold text-primary mb-2">Choose Your Gender! 🎭</h2>
				<p className="text-muted-foreground">Select a gender for your child</p>
			</div>
			
			<div className="grid grid-cols-2 gap-4 mb-6">
				<button
					type="button"
					onClick={() => setFormData({ ...formData, childGender: "female" })}
					className={`relative overflow-hidden rounded-2xl border-4 transition-all duration-300 transform hover:scale-105 ${
						formData.childGender === "female"
							? "border-primary shadow-2xl shadow-primary/50"
							: "border-transparent hover:border-primary/50"
					}`}
				>
					<div className="aspect-square relative">
						<img
							src="/Lalli-new.png"
							alt="Girl character - Lalli"
							className="w-full h-full object-cover"
						/>
						<div className={`absolute inset-0 bg-primary/20 transition-opacity ${
							formData.childGender === "female" ? "opacity-100" : "opacity-0"
						}`} />
					</div>
					<div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
						<h3 className="text-white text-xl font-bold">Lalli</h3>
						<p className="text-white/90 text-sm">Girl</p>
					</div>
					{formData.childGender === "female" && (
						<div className="absolute top-3 right-3">
							<div className="bg-primary text-primary-foreground rounded-full w-10 h-10 flex items-center justify-center">
								<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
								</svg>
							</div>
						</div>
					)}
				</button>

				<button
					type="button"
					onClick={() => setFormData({ ...formData, childGender: "male" })}
					className={`relative overflow-hidden rounded-2xl border-4 transition-all duration-300 transform hover:scale-105 ${
						formData.childGender === "male"
							? "border-primary shadow-2xl shadow-primary/50"
							: "border-transparent hover:border-primary/50"
					}`}
				>
					<div className="aspect-square relative">
						<img
							src="/Fafa_1.jpg"
							alt="Boy character - Fafa"
							className="w-full h-full object-cover"
						/>
						<div className={`absolute inset-0 bg-primary/20 transition-opacity ${
							formData.childGender === "male" ? "opacity-100" : "opacity-0"
						}`} />
					</div>
					<div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
						<h3 className="text-white text-xl font-bold">Fafa</h3>
						<p className="text-white/90 text-sm">Boy</p>
					</div>
					{formData.childGender === "male" && (
						<div className="absolute top-3 right-3">
							<div className="bg-primary text-primary-foreground rounded-full w-10 h-10 flex items-center justify-center">
								<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
								</svg>
							</div>
						</div>
					)}
				</button>
			</div>

			<div className="flex gap-3 pt-2">
				<Button
					onClick={handleBack}
					variant="outline"
					className="flex-1 py-6 text-lg"
					size="lg"
				>
					← Back
				</Button>
				<Button
					onClick={handleNext}
					className="flex-1 py-6 text-lg font-semibold"
					size="lg"
					disabled={!formData.childGender}
				>
					Continue →
				</Button>
			</div>
		</div>
	);

	const renderStep4 = () => (
		<form onSubmit={(e) => void handleSubmit(e)} className="space-y-6 animate-fade-in">
			<div className="text-center mb-6">
				<h2 className="text-3xl font-bold text-primary mb-2">Almost There! 🎨</h2>
				<p className="text-muted-foreground">Tell us about their favorites</p>
			</div>

			<div>
				<label htmlFor="childPhoto" className="block text-sm font-medium mb-2">
					Child's Photo (Optional)
				</label>
				<input
					id="childPhoto"
					type="file"
					accept="image/*"
					onChange={(e) => {
						const file = e.target.files?.[0] ?? null;
						setChildPhoto(file ?? null);
					}}
					className="w-full p-4 border rounded-lg text-lg transition-colors hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white text-primary border-primary"
				/>
				{childPhoto && (
					<p className="text-sm text-muted-foreground mt-2">
						Selected: {childPhoto.name} {isUploadingPhoto ? "(Uploading...)" : ""}
					</p>
				)}
			</div>

			<div>
				<label htmlFor="favoriteColor" className="block text-sm font-medium mb-2">
					Favorite Color
				</label>
				<select
					id="favoriteColor"
					value={formData.favoriteColor}
					onChange={(e) => setFormData({ ...formData, favoriteColor: e.target.value })}
					className="w-full p-4 border rounded-lg text-lg transition-colors hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white text-primary border-primary"
					style={{ backgroundColor: 'white', color: '#03A6A1' }}
				>
					<option value="">🌈 Choose a color</option>
					{COLORS.map((color) => (
						<option key={color} value={color} style={{ backgroundColor: 'white', color: '#03A6A1' }}>
							{color}
						</option>
					))}
				</select>
			</div>

			<div>
				<label htmlFor="favoriteAnimal" className="block text-sm font-medium mb-2">
					Favorite Animal
				</label>
				<select
					id="favoriteAnimal"
					value={formData.favoriteAnimal}
					onChange={(e) => setFormData({ ...formData, favoriteAnimal: e.target.value })}
					className="w-full p-4 border rounded-lg text-lg transition-colors hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white text-primary border-primary"
					style={{ backgroundColor: 'white', color: '#03A6A1' }}
				>
					<option value="">🐾 Choose an animal</option>
					{ANIMALS.map((animal) => (
						<option key={animal} value={animal} style={{ backgroundColor: 'white', color: '#03A6A1' }}>
							{animal}
						</option>
					))}
				</select>
			</div>

			<div className="flex gap-3 pt-2">
				<Button
					type="button"
					onClick={handleBack}
					variant="outline"
					className="flex-1 py-6 text-lg"
					size="lg"
				>
					← Back
				</Button>
				<Button
					type="submit"
					className="flex-1 py-6 text-lg font-semibold bg-primary hover:bg-primary/90"
					size="lg"
					disabled={isUploadingPhoto}
				>
					{isUploadingPhoto ? "Finishing up..." : "Create Profile ✨"}
				</Button>
			</div>
		</form>
	);

	return (
		<div className="flex items-start justify-center min-h-screen p-4 relative pt-8">
			{/* Animated background gradient */}
			<div className="fixed inset-0 bg-gradient-to-br from-purple-100 via-pink-50 to-yellow-50 -z-10 animate-gradient" />
			
			<div className="w-full max-w-lg py-8">
				{renderStepIndicator()}
				
				<Card className="backdrop-blur-xl bg-white/80 border-2 shadow-2xl">
					<CardContent className="p-8">
						{currentStep === 1 && renderStep1()}
						{currentStep === 2 && renderStep2()}
						{currentStep === 3 && renderStep3()}
						{currentStep === 4 && renderStep4()}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

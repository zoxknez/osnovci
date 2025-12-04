import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { lazy, Suspense } from "react";
import { Loader } from "lucide-react";

// Lazy load AI Chat component - heavy component with AI functionality
const AiChat = lazy(() => 
  import("@/components/features/ai/ai-chat").then((mod) => ({ 
    default: mod.AiChat 
  }))
);

export const metadata: Metadata = {
  title: "AI Nastavnik | Osnovci",
  description: "Tvoj lični AI asistent za učenje",
};

export default async function AiTutorPage() {
  const session = await auth();
  
  if (!session || !session.user || session.user.role !== "STUDENT") {
    redirect("/prijava");
  }

  return (
    <div className="container max-w-4xl mx-auto p-4 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">AI Nastavnik 🤖</h1>
        <p className="text-gray-600">Zaglavio si se na zadatku? Pitaj AI nastavnika za pomoć!</p>
      </div>

      <Suspense fallback={
        <div className="flex items-center justify-center py-12">
          <Loader className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      }>
        <AiChat />
      </Suspense>

      <div className="grid md:grid-cols-3 gap-4 mt-8">
        <div className="bg-blue-50 p-4 rounded-lg text-center">
          <div className="text-2xl mb-2">📐</div>
          <h3 className="font-semibold text-blue-900">Matematika</h3>
          <p className="text-sm text-blue-700">Pomoć sa jednačinama i geometrijom</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg text-center">
          <div className="text-2xl mb-2">🌍</div>
          <h3 className="font-semibold text-green-900">Geografija</h3>
          <p className="text-sm text-green-700">Glavni gradovi i reljef</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg text-center">
          <div className="text-2xl mb-2">🇬🇧</div>
          <h3 className="font-semibold text-purple-900">Engleski</h3>
          <p className="text-sm text-purple-700">Gramatika i prevod</p>
        </div>
      </div>
    </div>
  );
}

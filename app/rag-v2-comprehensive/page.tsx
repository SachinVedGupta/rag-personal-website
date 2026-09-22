import AvatarRenderer from "../components/AvatarRenderer";
import PortfolioSection from "../components/PortfolioSection";
import RagV2Page from "../rag-v2/page";

export default function ComprehensivePortfolioPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <section className="container mx-auto px-4 py-8">
        <div className="mx-auto mb-8 max-w-7xl">
          <AvatarRenderer />
        </div>
        <RagV2Page embedded />
      </section>
      <PortfolioSection />
      <footer className="bg-white-100 py-4 text-center text-sm text-gray-600 dark:bg-gray-900 dark:text-gray-400">
        © {new Date().getFullYear()} Sachin Gupta. All rights reserved.
      </footer>
    </main>
  );
}

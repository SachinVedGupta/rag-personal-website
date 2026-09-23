import AvatarRenderer from "../components/AvatarRenderer";
import PortfolioSection from "../components/PortfolioSection";
import RagV2Page from "../rag-v2/page";

export default function ComprehensivePortfolioPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:bg-none dark:bg-[#061426]">
      <section className="container mx-auto px-4 py-8">
        <div className="mx-auto mb-8 max-w-7xl">
          <AvatarRenderer />
        </div>
        <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
          <RagV2Page embedded />
        </div>
      </section>
      <PortfolioSection />
      <footer className="bg-white-100 py-4 text-center text-sm text-gray-600 dark:bg-gray-900 dark:text-gray-400">
        © {new Date().getFullYear()} Sachin Gupta. All rights reserved.
      </footer>
    </main>
  );
}

import { useState } from "react";
import Header from "@/components/Header";
import TabNavigation from "@/components/TabNavigation";
import KeywordResearch from "@/components/KeywordResearch";
import ContentOutline from "@/components/ContentOutline";
import OnPageSEO from "@/components/OnPageSEO";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'keyword-research' | 'content-outline' | 'onpage-seo'>('keyword-research');

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="mx-auto max-w-7xl px-8 py-12">
        {activeTab === 'keyword-research' && <KeywordResearch />}
        {activeTab === 'content-outline' && <ContentOutline />}
        {activeTab === 'onpage-seo' && <OnPageSEO />}
      </main>
    </div>
  );
}

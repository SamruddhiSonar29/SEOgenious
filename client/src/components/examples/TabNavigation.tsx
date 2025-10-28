import { useState } from 'react';
import TabNavigation from '../TabNavigation';

export default function TabNavigationExample() {
  const [activeTab, setActiveTab] = useState<'keyword-research' | 'content-outline' | 'onpage-seo'>('keyword-research');

  return (
    <TabNavigation 
      activeTab={activeTab} 
      onTabChange={(tab) => {
        console.log('Tab changed to:', tab);
        setActiveTab(tab);
      }} 
    />
  );
}

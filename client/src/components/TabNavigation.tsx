interface TabNavigationProps {
  activeTab: 'keyword-research' | 'content-outline' | 'onpage-seo';
  onTabChange: (tab: 'keyword-research' | 'content-outline' | 'onpage-seo') => void;
}

export default function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  const tabs = [
    { id: 'keyword-research' as const, label: 'Keyword Research' },
    { id: 'content-outline' as const, label: 'Content Outline' },
    { id: 'onpage-seo' as const, label: 'On-Page SEO' },
  ];

  return (
    <div className="border-b bg-background">
      <div className="mx-auto max-w-7xl px-8">
        <nav className="flex gap-1" role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              data-testid={`tab-${tab.id}`}
              onClick={() => onTabChange(tab.id)}
              className={`
                relative px-6 py-4 text-sm font-medium transition-colors duration-200
                ${
                  activeTab === tab.id
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }
              `}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}

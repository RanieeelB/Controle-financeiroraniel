import { AppSidebar } from './components/layout/AppSidebar';
import { DashboardHeader } from './components/layout/DashboardHeader';
import { SummaryCardsGrid } from './components/dashboard/SummaryCardsGrid';
import { summaryCardsMock } from './data/financial-dashboard-mock';

function App() {
  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex selection:bg-primary-container selection:text-on-primary-container relative">
      <AppSidebar />
      
      <main className="flex-1 ml-64 min-h-screen bg-background relative flex flex-col">
        {/* Abstract Background Glow */}
        <div className="absolute top-0 right-0 w-full h-[500px] bg-gradient-to-b from-primary/5 to-transparent pointer-events-none z-0"></div>
        
        <DashboardHeader />

        <div className="flex-1 p-xl max-w-[1440px] w-full mx-auto space-y-xl relative z-10">
          <SummaryCardsGrid data={summaryCardsMock} />
        </div>
      </main>
    </div>
  );
}

export default App;

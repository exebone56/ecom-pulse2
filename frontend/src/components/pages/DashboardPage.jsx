import RevenueChartDays from '../AnalyticCards/RevenueChartDays'
import MainLayout from '../Layout/MainLayout'
import RevenueMonth from '../AnalyticCards/RevenueMonth'
import CurrentIndicators from '../AnalyticCards/CurrentIndicators'
import RevenueMarketplace from '../AnalyticCards/RevenueMarketplace'
import TopCategories from '../AnalyticCards/TopCategories'
import LowInventory from '../AnalyticCards/LowInventory'
const DashboardPage = () => {
  return (
    <MainLayout>
        <div className="grid grid-cols-1 lg:grid-cols-[270px_1fr] gap-4">
          <RevenueMonth />
          <RevenueChartDays/>
          
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <CurrentIndicators />
              <RevenueMarketplace />
            </div>
          </div>
          
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <TopCategories />
              <LowInventory />
            </div>
          </div>
        </div>
    </MainLayout>
  )
}

export default DashboardPage
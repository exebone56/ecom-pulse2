import Footer from '../Footer'
import Header from '../Header'
import UserSettingsModal from '../Modals/UserSettingsModal'
import Sidebar from '../Sidebar'

const MainLayout = ({children}) => {
  
  return (
    <>
      <div className='h-full flex flex-col'>
        <div className="flex flex-1">
          <Sidebar navHeader="ECOM-PULSE" />
          <div className="flex-1 flex flex-col">
            <Header />
            <main className="flex-1 px-5 py-10">
              {children}
            </main>
            <Footer />
          </div>
        </div>
      </div>
      
    </>
  )
}

export default MainLayout
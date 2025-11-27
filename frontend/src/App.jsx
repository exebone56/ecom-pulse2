import { Routes, Route, Navigate } from 'react-router-dom'
import AuthLayout from './components/Auth/AuthLayout'
import DashboardPage from './components/pages/DashboardPage'
import ProductsPage from './components/pages/ProductsPage'
import ProductEditPage from './components/pages/ProductEditPage'
import EmployeesPage from './components/pages/EmployeesPage'
import OrdersPage from './components/pages/OrdersPage'
import StockPage from './components/pages/StockPage'
import { MenuProvider } from './components/contexts/MenuContext'
import { AuthProvider } from './components/contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import ProductCreatePage from './components/pages/ProductCreatePage'
import DocumentsPage from './components/pages/WarehouseDocumentPage';
import DocumentCreatePage from './components/pages/DocumentCreatePage';
import DocumentEditPage from './components/pages/DocumentEditPage';
import DocumentViewPage from './components/pages/DocumentViewPage'

function App() {

  return (
    <AuthProvider>
      <MenuProvider>
      <Routes>
        <Route path="/login" element={<AuthLayout />} />
        <Route path="/dashboard" element=
          {
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } 
        />
        <Route path="/orders" element=
          {
            <ProtectedRoute>
              <OrdersPage />
            </ProtectedRoute>
          } 
        />
        <Route path="/products" element=
          {
            <ProtectedRoute>
              <ProductsPage />
            </ProtectedRoute>
          } 
        />
        <Route path="/products/create" element=
          {
            <ProtectedRoute>
              <ProductCreatePage />
            </ProtectedRoute>
          } 
        />
        <Route path="/products/edit/:id" element=
          {
            <ProtectedRoute>
              <ProductEditPage />
            </ProtectedRoute>
          } 
        />
        <Route path="/warehouse/stock" element=
          {
            <ProtectedRoute>
              <StockPage />
            </ProtectedRoute>
          } 
        />
        <Route path="/warehouse/documents" element=
          {
            <ProtectedRoute>
              <DocumentsPage />
            </ProtectedRoute>
          } 
        />
        <Route path="/warehouse/documents/:id" element=
          {
            <ProtectedRoute>
              <DocumentViewPage />
            </ProtectedRoute>
          } 
        />  
        <Route path="/warehouse/documents/:id/edit" element=
          {
            <ProtectedRoute>
              <DocumentEditPage />
            </ProtectedRoute>
          } 
        />
        <Route path="/warehouse/documents/create" element=
          {
            <ProtectedRoute>
              <DocumentCreatePage />
            </ProtectedRoute>
          } 
        />
        <Route path="/employees" element=
          {
            <ProtectedRoute>
              <EmployeesPage />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </MenuProvider>
    </AuthProvider>
    
      
  )
}

export default App

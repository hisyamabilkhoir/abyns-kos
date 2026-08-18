import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Properties from "./pages/Properties";
import PropertyDetail from "./pages/PropertyDetail";
import Tenants from "./pages/Tenants";
import TenantDetail from "./pages/TenantDetail";
import Billing from "./pages/Billing";
import Maintenance from "./pages/Maintenance";
import Finance from "./pages/Finance";
import AIAssistant from "./pages/AIAssistant";
import Layout from "./components/Layout";
import TenantLogin from "./pages/tenant/TenantLogin";
import TenantLayout from "./pages/tenant/TenantLayout";
import TenantDashboard from "./pages/tenant/TenantDashboard";
import TenantBills from "./pages/tenant/TenantBills";
import TenantMaintenance from "./pages/tenant/TenantMaintenance";
import PayResult from "./pages/tenant/PayResult";

export default function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />

          {/* Owner app */}
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/properties" element={<Properties />} />
            <Route path="/properties/:id" element={<PropertyDetail />} />
            <Route path="/tenants" element={<Tenants />} />
            <Route path="/tenants/:id" element={<TenantDetail />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/maintenance" element={<Maintenance />} />
            <Route path="/finance" element={<Finance />} />
            <Route path="/ai" element={<AIAssistant />} />
          </Route>

          {/* Tenant portal */}
          <Route path="/tenant/login" element={<TenantLogin />} />
          <Route path="/tenant/pay/result" element={<PayResult />} />
          <Route path="/tenant/:id" element={<TenantLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<TenantDashboard />} />
            <Route path="bills" element={<TenantBills />} />
            <Route path="maintenance" element={<TenantMaintenance />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

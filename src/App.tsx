/**
 * =============================================
 * APP COMPONENT
 * =============================================
 * Root component với routing và providers
 */

import { ReactNode } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ConfigProvider } from "antd";
import viVN from "antd/locale/vi_VN";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

// Layouts
import AdminLayout from "./components/layouts/AdminLayout";
import WorkerLayout from "./components/layouts/WorkerLayout";

// Auth Pages (NEW - shadcn/ui)
import {
  LoginPage,
  RegisterPage,
  ForgotPasswordPage,
  ResetPasswordPage,
} from "./pages/auth";

// Worker Pages
import WorkerDashboard from "./pages/worker/WorkerDashboard";
import CompleteRegistrationPage from "./pages/worker/CompleteRegistrationPage";
import SalaryPage from "./pages/worker/SalaryPage";
import SummaryPage from "./pages/SummaryPage";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import VehicleTypesPage from "./pages/admin/VehicleTypesPage";
import ProcessManagementPage from "./pages/admin/ProcessManagementPage";
import ProductionStandardsPage from "./pages/admin/ProductionStandardsPage";
import ProductionOrdersPage from "./pages/admin/ProductionOrdersPage";
import ProductionOrderDetailPage from "./pages/admin/ProductionOrderDetailPage";
import ProductionOrderReportPage from "./pages/admin/ProductionOrderReportPage";
import UsersManagementPage from "./pages/admin/UsersManagementPage";
import UserWorkHistoryPage from "./pages/admin/UserWorkHistoryPage";

// Loading component
const LoadingScreen = () => (
  <div
    style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#f0f2f5",
    }}
  >
    <div style={{ fontSize: 18, color: "#666" }}>Đang tải...</div>
  </div>
);

interface RouteGuardProps {
  children: ReactNode;
}

// Route chỉ dành cho Admin/Supervisor
const AdminRoute = ({ children }: RouteGuardProps) => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;

  // CHỈ admin và supervisor mới vào được
  if (!["admin", "supervisor"].includes(user.role)) {
    return <Navigate to="/worker" replace />;
  }

  return <AdminLayout>{children}</AdminLayout>;
};

// Route dành cho tất cả user đã đăng nhập (worker, admin, supervisor)
const WorkerRoute = ({ children }: RouteGuardProps) => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;

  return <WorkerLayout>{children}</WorkerLayout>;
};

// Điều hướng theo vai trò
const RoleBasedRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;

  // Worker chỉ được vào trang worker
  if (user.role === "worker") {
    return <Navigate to="/worker" replace />;
  }

  // Admin/Supervisor vào trang admin
  return <Navigate to="/admin" replace />;
};

// Guest route - chỉ cho phép khi chưa đăng nhập
const GuestRoute = ({ children }: RouteGuardProps) => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to="/" replace />;

  return <>{children}</>;
};

function App() {
  return (
    <ConfigProvider
      locale={viVN}
      theme={{
        token: {
          colorPrimary: "#1677ff",
          borderRadius: 8,
        },
      }}
    >
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* ========== PUBLIC ROUTES ========== */}
            {/* Chỉ hiển thị khi chưa đăng nhập */}
            <Route
              path="/login"
              element={
                <GuestRoute>
                  <LoginPage />
                </GuestRoute>
              }
            />
            <Route
              path="/register"
              element={
                <GuestRoute>
                  <RegisterPage />
                </GuestRoute>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <GuestRoute>
                  <ForgotPasswordPage />
                </GuestRoute>
              }
            />
            <Route
              path="/reset-password"
              element={
                <GuestRoute>
                  <ResetPasswordPage />
                </GuestRoute>
              }
            />

            {/* Role-based redirect */}
            <Route path="/" element={<RoleBasedRedirect />} />

            {/* ========== WORKER ROUTES ========== */}
            {/* Tất cả user đều có thể vào (worker, admin, supervisor) */}
            <Route
              path="/worker"
              element={
                <WorkerRoute>
                  <WorkerDashboard />
                </WorkerRoute>
              }
            />
            <Route
              path="/worker/complete/:id"
              element={
                <WorkerRoute>
                  <CompleteRegistrationPage />
                </WorkerRoute>
              }
            />
            <Route
              path="/summary"
              element={
                <WorkerRoute>
                  <SummaryPage />
                </WorkerRoute>
              }
            />
            <Route
              path="/worker/salary"
              element={
                <WorkerRoute>
                  <SalaryPage />
                </WorkerRoute>
              }
            />

            {/* ========== ADMIN ROUTES ========== */}
            {/* CHỈ admin và supervisor mới vào được */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/vehicle-types"
              element={
                <AdminRoute>
                  <VehicleTypesPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/processes"
              element={
                <AdminRoute>
                  <ProcessManagementPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/standards"
              element={
                <AdminRoute>
                  <ProductionStandardsPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/orders"
              element={
                <AdminRoute>
                  <ProductionOrdersPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/production-orders/:id"
              element={
                <AdminRoute>
                  <ProductionOrderDetailPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/production-orders/:id/report"
              element={
                <AdminRoute>
                  <ProductionOrderReportPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <AdminRoute>
                  <UsersManagementPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/users/:id/history"
              element={
                <AdminRoute>
                  <UserWorkHistoryPage />
                </AdminRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;

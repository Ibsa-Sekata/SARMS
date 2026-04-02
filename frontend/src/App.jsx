import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { TeacherClassProvider } from "./contexts/TeacherClassContext";
import AppShell from "./components/AppShell";
import Login from "./views/Login";
import Dashboard from "./views/Dashboard";
import StudentRoster from "./views/StudentRoster";
import MarkEntry from "./views/MarkEntry";
import HomeroomApproval from "./views/HomeroomApproval";
import StudentManagement from "./views/StudentManagement";
import ManageTeachers from "./views/Admin/ManageTeachers";
import ManageStudents from "./views/Admin/ManageStudents";
import ManageDepartments from "./views/Admin/ManageDepartments";
import ManageClasses from "./views/Admin/ManageClasses";
import AcademicSettings from "./views/Admin/AcademicSettings";
import "./App.css";

const LoadingScreen = () => (
  <div className="loading-container app-loading-full">
    <div className="loading-spinner" />
    <p>Loading…</p>
  </div>
);

const ProtectedLayout = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login/teacher" replace />;
  }

  return (
    <TeacherClassProvider>
      <AppShell>
        <Outlet />
      </AppShell>
    </TeacherClassProvider>
  );
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return user ? <Navigate to="/dashboard" replace /> : children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <div className="app-viewport-fill">
            <Routes>
              <Route
                path="/login"
                element={<Navigate to="/login/teacher" replace />}
              />
              <Route
                path="/login/teacher"
                element={
                  <PublicRoute>
                    <Login variant="teacher" />
                  </PublicRoute>
                }
              />
              <Route
                path="/login/admin"
                element={
                  <PublicRoute>
                    <Login variant="admin" />
                  </PublicRoute>
                }
              />

              <Route element={<ProtectedLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/roster" element={<StudentRoster />} />
                <Route path="/marks" element={<MarkEntry />} />
                <Route path="/homeroom/approval" element={<HomeroomApproval />} />
                <Route path="/students" element={<StudentManagement />} />
                <Route path="/admin/teachers" element={<ManageTeachers />} />
                <Route path="/admin/students" element={<ManageStudents />} />
                <Route
                  path="/admin/departments"
                  element={<ManageDepartments />}
                />
                <Route path="/admin/classes" element={<ManageClasses />} />
                <Route path="/admin/settings" element={<AcademicSettings />} />
              </Route>

              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>

          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              className: "sarms-toast",
              style: {
                background: "var(--color-surface-elevated)",
                color: "var(--color-text)",
                border: "1px solid var(--color-border)",
                boxShadow: "var(--shadow-md)",
              },
              success: {
                iconTheme: {
                  primary: "var(--color-success)",
                  secondary: "#fff",
                },
              },
              error: {
                iconTheme: {
                  primary: "var(--color-danger)",
                  secondary: "#fff",
                },
              },
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

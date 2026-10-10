import {
    BrowserRouter,
    Routes,
    Route,
    Navigate
} from "react-router-dom";

import {
    AuthProvider
} from "./context/AuthContext";

import ErrorBoundary
    from "./components/ErrorBoundary";

import ProtectedRoute
    from "./components/ProtectedRoute";

import RoleBasedRoute
    from "./components/RoleBasedRoute";

import AppLayout
    from "./components/AppLayout";

import Login
    from "./pages/Login";

import FacultyDashboardPage
    from "./pages/FacultyDashboardPage";

import AttendanceHistoryPage
    from "./pages/AttendanceHistoryPage";

import FacultyDetailsPage
    from "./pages/FacultyDetailsPage";

import Profile
    from "./pages/Profile";

import AdminDashboardPage
    from "./pages/AdminDashboardPage";

import FacultyManagementPage
    from "./pages/FacultyManagementPage";

import AttendanceManagementPage
    from "./pages/AttendanceManagementPage";

import AuditLogViewerPage
    from "./pages/AuditLogViewerPage";

import PolicyConfigurationPage
    from "./pages/PolicyConfigurationPage";

import CampusLocationConfigurationPage
    from "./pages/CampusLocationConfigurationPage";

import NetworkConfigurationPage
    from "./pages/NetworkConfigurationPage";

import ReportsPage
    from "./pages/ReportsPage";

import NotFound
    from "./pages/NotFound";

import Unauthorized
    from "./pages/Unauthorized";


function App() {

    return (
        <AuthProvider>

            <ErrorBoundary>

                <BrowserRouter>

                    <Routes>

                        {/* ========================================
                            PUBLIC ROUTES
                        ======================================== */}

                        <Route
                            path="/"
                            element={
                                <Navigate
                                    to="/login"
                                    replace
                                />
                            }
                        />

                        <Route
                            path="/login"
                            element={<Login />}
                        />


                        {/* ========================================
                            PROTECTED APPLICATION ROUTES
                        ======================================== */}

                        <Route
                            element={
                                <ProtectedRoute>
                                    <AppLayout />
                                </ProtectedRoute>
                            }
                        >

                            {/* ====================================
                                FACULTY ROUTES
                            ==================================== */}

                            <Route
                                path="/faculty"
                                element={
                                    <RoleBasedRoute
                                        allowedRole="faculty"
                                    >
                                        <FacultyDashboardPage />
                                    </RoleBasedRoute>
                                }
                            />

                            <Route
                                path="/faculty/:facultyId"
                                element={
                                    <RoleBasedRoute
                                        allowedRole="faculty"
                                    >
                                        <FacultyDetailsPage />
                                    </RoleBasedRoute>
                                }
                            />

                            <Route
    path="/attendance"
    element={
        <AttendanceHistoryPage />
    }
/>

                            <Route
                                path="/profile"
                                element={
                                    <RoleBasedRoute
                                        allowedRole="faculty"
                                    >
                                        <Profile />
                                    </RoleBasedRoute>
                                }
                            />


                            {/* ====================================
                                ADMIN ROUTES
                            ==================================== */}

                            <Route
                                path="/admin"
                                element={
                                    <RoleBasedRoute
                                        allowedRole="admin"
                                    >
                                        <AdminDashboardPage />
                                    </RoleBasedRoute>
                                }
                            />

                            <Route
                                path="/admin/faculty"
                                element={
                                    <RoleBasedRoute
                                        allowedRole="admin"
                                    >
                                        <FacultyManagementPage />
                                    </RoleBasedRoute>
                                }
                            />

                            <Route
                                path="/admin/attendance"
                                element={
                                    <RoleBasedRoute
                                        allowedRole="admin"
                                    >
                                        <AttendanceManagementPage />
                                    </RoleBasedRoute>
                                }
                            />

                            <Route
                                path="/admin/audit"
                                element={
                                    <RoleBasedRoute
                                        allowedRole="admin"
                                    >
                                        <AuditLogViewerPage />
                                    </RoleBasedRoute>
                                }
                            />

                            <Route
                                path="/admin/policy"
                                element={
                                    <RoleBasedRoute
                                        allowedRole="admin"
                                    >
                                        <PolicyConfigurationPage />
                                    </RoleBasedRoute>
                                }
                            />

                            <Route
                                path="/admin/location"
                                element={
                                    <RoleBasedRoute
                                        allowedRole="admin"
                                    >
                                        <CampusLocationConfigurationPage />
                                    </RoleBasedRoute>
                                }
                            />

                            <Route
                                path="/admin/network"
                                element={
                                    <RoleBasedRoute
                                        allowedRole="admin"
                                    >
                                        <NetworkConfigurationPage />
                                    </RoleBasedRoute>
                                }
                            />

                            <Route
                                path="/admin/reports"
                                element={
                                    <RoleBasedRoute
                                        allowedRole="admin"
                                    >
                                        <ReportsPage />
                                    </RoleBasedRoute>
                                }
                            />

                        </Route>


                        {/* ========================================
                            ACCESS / ERROR ROUTES
                        ======================================== */}

                        <Route
                            path="/unauthorized"
                            element={
                                <Unauthorized />
                            }
                        />

                        <Route
                            path="*"
                            element={
                                <NotFound />
                            }
                        />

                    </Routes>

                </BrowserRouter>

            </ErrorBoundary>

        </AuthProvider>
    );
}

export default App;
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";

function AppLayout() {
    return (
        <>
            <Header />

            <div className="app-layout">

                <Sidebar />

                <main className="main-content">
                    <Outlet />
                </main>

            </div>
        </>
    );
}

export default AppLayout;
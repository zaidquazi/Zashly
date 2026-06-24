import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import BottomNav from "./BottomNav";

const Layout = ({ children, showSidebar = false, showNavbar = true }) => {
  return (
    <div className="h-screen overflow-hidden flex flex-col">
      <div className={`flex flex-1 overflow-hidden ${showSidebar ? "lg:pl-48" : ""}`}>
        {showSidebar && <Sidebar />}

        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-base-100">
          {showNavbar && <Navbar showSidebar={showSidebar} />}

          <main className={`flex-1 overflow-y-auto ${showSidebar ? "pb-16 lg:pb-0" : ""}`}>{children}</main>
        </div>
      </div>

      {showSidebar && <BottomNav />}
    </div>
  );
};
export default Layout;

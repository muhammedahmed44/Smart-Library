import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  toggleNavSidebar,
  collapseNavSidebar,
  expandNavSidebar,
  selectNavSidebarCollapsed,
} from '../store/slices/readerSlice';
import Navbar from '../components/shared/Navbar';
import Sidebar from '../components/shared/Sidebar';
import ErrorBoundary from '../components/shared/ErrorBoundary';

export default function AppLayout({ theme, onToggleTheme }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const dispatch = useDispatch();
  const collapsed = useSelector(selectNavSidebarCollapsed);
  const location = useLocation();

  // Auto-collapse the nav sidebar when entering reader mode,
  // restore it when leaving.
  const isReaderRoute = location.pathname.startsWith('/reader');
  useEffect(() => {
    if (isReaderRoute) {
      dispatch(collapseNavSidebar());
    } else {
      dispatch(expandNavSidebar());
    }
  }, [isReaderRoute, dispatch]);

  const sidebarWidth = collapsed ? 'lg:ml-[64px]' : 'lg:ml-[240px]';

  return (
    <div className="h-full flex flex-col">
      <Navbar
        theme={theme}
        onToggleTheme={onToggleTheme}
        onMenuClick={() => setMobileSidebarOpen(true)}
      />

      <div className="flex flex-1 pt-[60px] overflow-hidden">
        <Sidebar
          mobileOpen={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
          onToggleCollapse={() => dispatch(toggleNavSidebar())}
        />

        {/* Main content — shifts right based on sidebar width */}
        <main className={`flex-1 overflow-y-auto transition-all duration-200 ${sidebarWidth}`}>
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

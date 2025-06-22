"use client";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/ui/Navbar";

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navbar */}
        <Navbar />
        
        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
} 
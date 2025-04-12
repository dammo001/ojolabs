import type { NextPage } from "next";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { Folder, FileText, Plus, Clock, LogOut, User } from "lucide-react";
import { api } from "~/utils/api";

const Dashboard: NextPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const { data: cases, isLoading: casesLoading } = api.case.getAll.useQuery();
  
  // Redirect unauthenticated users to homepage
  if (status === "unauthenticated") {
    router.push("/");
    return null;
  }
  
  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }
  
  const recentCases = cases && cases.length > 0 
    ? cases.slice(0, 5) 
    : [];
  
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-indigo-700 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/dashboard">
                  <span className="text-white text-xl font-bold">LegalDocs</span>
                </Link>
              </div>
            </div>

            <div className="flex items-center">
              <Link 
                href="/cases" 
                className="text-gray-100 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                Cases
              </Link>
              
              <div className="ml-3 relative">
                <div className="flex items-center">
                  <button className="bg-indigo-800 flex text-sm rounded-full p-1">
                    {session.user?.image ? (
                      <img
                        className="h-8 w-8 rounded-full"
                        src={session.user.image}
                        alt=""
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full flex items-center justify-center bg-indigo-600 text-white">
                        <User size={16} />
                      </div>
                    )}
                  </button>
                </div>
              </div>
              
              <button
                onClick={() => signOut()}
                className="ml-4 text-gray-100 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center"
              >
                <LogOut size={16} className="mr-1" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Welcome back, {session?.user?.name}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Folder className="mr-2 text-indigo-600" size={20} />
                  Recent Cases
                </h2>
                <Link 
                  href="/cases" 
                  className="text-sm text-indigo-600 hover:text-indigo-800"
                >
                  View all
                </Link>
              </div>
              
              {casesLoading ? (
                <div className="flex justify-center items-center h-40">
                  <div className="text-gray-500">Loading cases...</div>
                </div>
              ) : recentCases.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {recentCases.map((item) => (
                    <li key={item.id} className="py-3">
                      <Link 
                        href={`/cases/${item.id}`} 
                        className="flex justify-between items-center hover:bg-gray-50 -mx-4 px-4 py-2 rounded-md"
                      >
                        <div className="flex items-center">
                          <FileText size={16} className="mr-2 text-gray-500" />
                          <span className="text-gray-900">{item.title}</span>
                        </div>
                        <div className="text-xs text-gray-500 flex items-center">
                          <Clock size={12} className="mr-1" />
                          {new Date(item.updatedAt).toLocaleDateString()}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No cases found</p>
                  <Link 
                    href="/cases/new" 
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Plus size={16} className="mr-1" />
                    Create your first case
                  </Link>
                </div>
              )}
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Clock className="mr-2 text-indigo-600" size={20} />
                  Quick Actions
                </h2>
              </div>
              
              <div className="space-y-3">
                <Link 
                  href="/cases/new" 
                  className="block w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-md border border-gray-200 text-gray-900 font-medium"
                >
                  <div className="flex items-center">
                    <Plus size={16} className="mr-2 text-indigo-600" />
                    Create a new case
                  </div>
                </Link>
                
                {recentCases.length > 0 && (
                  <Link 
                    href={`/cases/${recentCases[0].id}`} 
                    className="block w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-md border border-gray-200 text-gray-900 font-medium"
                  >
                    <div className="flex items-center">
                      <FileText size={16} className="mr-2 text-indigo-600" />
                      Continue with latest case
                    </div>
                    <div className="text-xs text-gray-500 mt-1 ml-6">
                      {recentCases[0].title}
                    </div>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
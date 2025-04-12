import type { NextPage } from "next";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Link from "next/link";
import { ArrowLeft, Save, AlertCircle } from "lucide-react";
import { api } from "~/utils/api";

const NewCasePage: NextPage = () => {
  const { status } = useSession();
  const router = useRouter();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  
  const createCase = api.case.create.useMutation({
    onSuccess: (data) => {
      router.push(`/cases/${data.id}`);
    },
    onError: (error) => {
      setFormError(error.message);
    },
  });
  
  // Redirect unauthenticated users to homepage
  if (status === "unauthenticated") {
    router.push("/");
    return null;
  }
  
  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-100 flex justify-center items-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    if (!title.trim()) {
      setFormError("Case title is required");
      return;
    }
    
    createCase.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
    });
  };
  
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-indigo-700 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/dashboard">
                <span className="text-white text-xl font-bold">LegalDocs</span>
              </Link>
            </div>
            <div className="ml-6 flex space-x-4 items-center">
              <Link 
                href="/dashboard" 
                className="text-gray-200 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                Dashboard
              </Link>
              <Link 
                href="/cases" 
                className="text-gray-200 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                Cases
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Link 
              href="/cases" 
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft size={16} className="mr-1" />
              Back to cases
            </Link>
            <h1 className="mt-2 text-2xl font-bold text-gray-900">Create New Case</h1>
          </div>
          
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
            <form onSubmit={handleSubmit}>
              {formError && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md flex items-start">
                  <AlertCircle size={20} className="mr-2 flex-shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}
              
              <div className="mb-4">
                <label 
                  htmlFor="title" 
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Case Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Enter case title"
                  required
                />
              </div>
              
              <div className="mb-6">
                <label 
                  htmlFor="description" 
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Description (optional)
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Enter case description"
                />
              </div>
              
              <div className="flex justify-end">
                <Link
                  href="/cases"
                  className="mr-3 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={createCase.isLoading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createCase.isLoading ? (
                    "Creating..."
                  ) : (
                    <>
                      <Save size={16} className="mr-1.5" />
                      Create Case
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NewCasePage;
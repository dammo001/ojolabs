import type { NextPage } from "next";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Briefcase, FileText, Shield } from "lucide-react";

const Home: NextPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Redirect authenticated users to dashboard
  if (status === "authenticated") {
    router.push("/dashboard");
    return null;
  }
  
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-indigo-700 shadow-md p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="text-white text-xl font-bold">LegalDocs</div>
          <Link 
            href="/auth/signin" 
            className="bg-white text-indigo-700 px-4 py-2 rounded-md font-medium hover:bg-gray-100"
          >
            Sign In
          </Link>
        </div>
      </nav>

      <main>
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
              Legal Document Management
            </h1>
            <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500">
              Organize and analyze your legal cases with AI-powered document management
            </p>
            <div className="mt-8 flex justify-center">
              <Link
                href="/auth/signin"
                className="px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>

        <div className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:text-center">
              <h2 className="text-base text-indigo-600 font-semibold tracking-wide uppercase">
                Features
              </h2>
              <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                Streamline your legal workflow
              </p>
            </div>

            <div className="mt-10">
              <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-3 md:gap-x-8 md:gap-y-10">
                <div className="text-center">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white mx-auto">
                    <Briefcase size={24} />
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">
                    Case Organization
                  </h3>
                  <p className="mt-2 text-base text-gray-500">
                    Organize documents by case and category for efficient access and management.
                  </p>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white mx-auto">
                    <FileText size={24} />
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">
                    AI Document Summarization
                  </h3>
                  <p className="mt-2 text-base text-gray-500">
                    Automatically generate summaries of legal documents to quickly understand key points.
                  </p>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white mx-auto">
                    <Shield size={24} />
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">
                    Secure Access
                  </h3>
                  <p className="mt-2 text-base text-gray-500">
                    Control who can access your sensitive legal documents with robust authentication.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-gray-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p>© 2025 LegalDocs. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
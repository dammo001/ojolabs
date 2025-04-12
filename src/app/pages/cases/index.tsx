import type { NextPage } from "next";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Folder, FileText, Plus, Search, Clock, Trash2 } from "lucide-react";
import { api } from "~/utils/api";

const CasesPage: NextPage = () => {
  const { status } = useSession();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(null);
  
  const { data: cases, isLoading } = api.case.getAll.useQuery();
  const utils = api.useContext();
  
  const deleteCase = api.case.delete.useMutation({
    onSuccess: () => {
      utils.case.getAll.invalidate();
      setShowConfirmDelete(null);
    },
  });
  
  // Redirect unauthenticated users to homepage
  if (status === "unauthenticated") {
    router.push("/");
    return null;
  }
  
  // Show loading state while checking authentication
  if (status === "loading" || isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }
  
  const filteredCases = cases?.filter((item) =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  const handleDelete = (id: string) => {
    deleteCase.mutate({ id });
  };
  
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
              <div className="ml-6 flex space-x-4 items-center">
                <Link 
                  href="/dashboard" 
                  className="text-gray-200 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  Dashboard
                </Link>
                <Link 
                  href="/cases" 
                  className="text-white px-3 py-2 rounded-md text-sm font-medium bg-indigo-800"
                >
                  Cases
                </Link>
              </div>
            </div
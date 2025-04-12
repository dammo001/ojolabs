import type { NextPage } from "next";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Link from "next/link";
import { ArrowLeft, Edit, Save, X, FileText, Download, Trash2, MoveVertical } from "lucide-react";
import { api } from "~/utils/api";

const DocumentDetailsPage: NextPage = () => {
  const { status } = useSession();
  const router = useRouter();
  const { id } = router.query;
  
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [editedSummary, setEditedSummary] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSectionSelector, setShowSectionSelector] = useState(false);
  
  // Fetch document details
  const {
    data: document,
    isLoading,
    isError,
  } = api.document.getById.useQuery(
    { id: id as string },
    { enabled: !!id && typeof id === "string" }
  );
  
  // Fetch sections for the case if document exists
  const { data: sections } = api.section.getAllByCaseId.useQuery(
    { caseId: document?.caseId || "" },
    { enabled: !!document?.caseId }
  );
  
  const utils = api.useContext();
  
  const updateDocument = api.document.update.useMutation({
    onSuccess: () => {
      utils.document.getById.invalidate({ id: id as string });
      setIsEditingSummary(false);
      setIsEditingName(false);
    },
  });
  
  const deleteDocument = api.document.delete.useMutation({
    onSuccess: () => {
      if (document?.caseId) {
        router.push(`/cases/${document.caseId}`);
      } else {
        router.push("/cases");
      }
    },
  });
  
  const generateSummary = api.document.generateSummary.useMutation({
    onSuccess: (data) => {
      setEditedSummary(data.summary);
      updateDocument.mutate({
        id: id as string,
        summary: data.summary,
      });
    },
  });
  
  // Redirect unauthenticated users to homepage
  if (status === "unauthenticated") {
    router.push("/");
    return null;
  }
  
  // Show loading state
  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex justify-center items-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }
  
  // Handle error state
  if (isError || !document) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="max-w-3xl mx-auto text-center py-12">
          <h2 className="text-lg font-medium text-gray-900">Document not found</h2>
          <p className="mt-2 text-sm text-gray-500">
            The document you are looking for does not exist or you don't have permission to view it.
          </p>
          <div className="mt-6">
            <Link
              href="/cases"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Return to Cases
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  const handleEditSummaryToggle = () => {
    if (!isEditingSummary) {
      setEditedSummary(document.summary || "");
    }
    setIsEditingSummary(!isEditingSummary);
  };
  
  const handleSaveSummary = () => {
    updateDocument.mutate({
      id: document.id,
      summary: editedSummary.trim() || null,
    });
  };
  
  const handleEditNameToggle = () => {
    if (!isEditingName) {
      setEditedName(document.name);
    }
    setIsEditingName(!isEditingName);
  };
  
  const handleSaveName = () => {
    if (!editedName.trim()) return;
    
    updateDocument.mutate({
      id: document.id,
      name: editedName.trim(),
    });
  };
  
  const handleRequestSummary = () => {
    // In a real app, you would extract text from the document
    // For this example, we'll simulate with a sample text
    const sampleText = "This is a sample legal document content that would be extracted from the actual file. The AI would generate a summary based on this content.";
    
    generateSummary.mutate({
      content: sampleText,
      documentId: document.id,
    });
  };
  
  const handleDeleteDocument = () => {
    deleteDocument.mutate({ id: document.id });
  };
  
  const handleMoveToSection = (sectionId: string | null) => {
    updateDocument.mutate({
      id: document.id,
      sectionId,
    });
    setShowSectionSelector(false);
  };
  
  const getFileIcon = (fileType: string) => {
    if (fileType.includes("pdf")) return <FileText size={24} className="text-red-500" />;
    if (fileType.includes("word")) return <FileText size={24} className="text-blue-500" />;
    if (fileType.includes("excel") || fileType.includes("spreadsheet")) 
      return <FileText size={24} className="text-green-500" />;
    return <FileText size={24} className="text-gray-500" />;
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Link 
              href={`/cases/${document.caseId}`}
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft size={16} className="mr-1" />
              Back to case
            </Link>
          </div>
          
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div className="flex items-start">
                  <div className="mr-4 mt-1">
                    {getFileIcon(document.fileType)}
                  </div>
                  
                  <div>
                    {isEditingName ? (
                      <div className="flex items-center">
                        <input
                          type="text"
                          value={editedName}
                          onChange={(e) => setEditedName(e.target.value)}
                          className="block rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-lg font-medium w-full"
                        />
                        <div className="ml-2 flex-shrink-0">
                          <button
                            onClick={handleSaveName}
                            className="p-1.5 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 mr-1"
                            title="Save name"
                          >
                            <Save size={16} />
                          </button>
                          <button
                            onClick={handleEditNameToggle}
                            className="p-1.5 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
                            title="Cancel"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <h1 className="text-xl font-medium text-gray-900">{document.name}</h1>
                        <button
                          onClick={handleEditNameToggle}
                          className="ml-2 p-1 text-gray-400 hover:text-gray-600"
                          title="Edit name"
                        >
                          <Edit size={16} />
                        </button>
                      </div>
                    )}
                    
                    <div className="mt-1 text-sm text-gray-500">
                      Uploaded: {new Date(document.uploadedAt).toLocaleDateString()}
                      <span className="mx-1.5">•</span>
                      Size: {(document.fileSize / 1024).toFixed(1)} KB
                      {document.sectionId && sections && (
                        <>
                          <span className="mx-1.5">•</span>
                          Section: {sections.find(s => s.id === document.sectionId)?.name}
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex">
                  <div className="relative">
                    <button
                      onClick={() => setShowSectionSelector(!showSectionSelector)}
                      className="p-2 text-gray-600 hover:text-indigo-600 rounded-md bg-gray-100 hover:bg-gray-200 mr-2"
                      title="Move to section"
                    >
                      <MoveVertical size={18} />
                    </button>
                    
                    {showSectionSelector && sections && (
                      <div className="absolute right-0 mt-1 w-56 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                        <div className="px-3 py-2 border-b border-gray-200">
                          <p className="text-xs font-medium text-gray-700">Move to section</p>
                        </div>
                        <ul className="py-1 text-sm text-gray-700 max-h-64 overflow-auto">
                          {sections.map((section) => (
                            <li key={section.id}>
                              <button
                                onClick={() => handleMoveToSection(section.id)}
                                className={`block px-4 py-2 w-full text-left hover:bg-gray-100 ${
                                  document.sectionId === section.id ? "bg-indigo-50 text-indigo-700" : ""
                                }`}
                              >
                                {section.name}
                              </button>
                            </li>
                          ))}
                          {document.sectionId && (
                            <li>
                              <button
                                onClick={() => handleMoveToSection(null)}
                                className="block px-4 py-2 w-full text-left hover:bg-gray-100 text-red-600"
                              >
                                Remove from section
                              </button>
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  
                    href={document.fileUrl}
                    download={document.name}
                    className="p-2 text-gray-600 hover:text-indigo-600 rounded-md bg-gray-100 hover:bg-gray-200 mr-2"
                    title="Download document"
                  >
                    <Download size={18} />
                  </a>
                  
                  <div className="relative">
                    <button
                      onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
                      className="p-2 text-gray-600 hover:text-red-600 rounded-md bg-gray-100 hover:bg-gray-200"
                      title="Delete document"
                    >
                      <Trash2 size={18} />
                    </button>
                    
                    {showDeleteConfirm && (
                      <div className="absolute right-0 mt-1 w-64 bg-white rounded-md shadow-lg z-10 border border-gray-200 p-4">
                        <p className="text-sm text-gray-700 mb-3">Are you sure you want to delete this document?</p>
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => setShowDeleteConfirm(false)}
                            className="px-3 py-1.5 text-sm rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleDeleteDocument}
                            className="px-3 py-1.5 text-sm rounded bg-red-600 text-white hover:bg-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-lg font-medium text-gray-900">Document Summary</h2>
                  <div>
                    {!document.summary && !isEditingSummary && !generateSummary.isLoading && (
                      <button
                        onClick={handleRequestSummary}
                        className="text-sm text-indigo-600 hover:text-indigo-800 mr-3"
                      >
                        Generate AI Summary
                      </button>
                    )}
                    
                    {!isEditingSummary ? (
                      <button
                        onClick={handleEditSummaryToggle}
                        className="text-sm text-gray-600 hover:text-gray-800"
                      >
                        {document.summary ? "Edit Summary" : "Add Summary"}
                      </button>
                    ) : (
                      <div className="flex space-x-2">
                        <button
                          onClick={handleSaveSummary}
                          className="text-sm text-green-600 hover:text-green-800"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleEditSummaryToggle}
                          className="text-sm text-gray-600 hover:text-gray-800"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                {isEditingSummary ? (
                  <textarea
                    value={editedSummary}
                    onChange={(e) => setEditedSummary(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    rows={8}
                    placeholder="Enter document summary..."
                  />
                ) : generateSummary.isLoading ? (
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="text-gray-500 animate-pulse">Generating summary with AI...</p>
                  </div>
                ) : document.summary ? (
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="whitespace-pre-wrap text-gray-700">{document.summary}</p>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-4 rounded-md text-center">
                    <p className="text-gray-500">No summary available</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Add a summary manually or generate one with AI
                    </p>
                  </div>
                )}
              </div>
              
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-2">Document Preview</h2>
                
                {/* This is a placeholder for document preview */}
                <div className="border border-gray-200 rounded-md p-8 bg-gray-50 text-center">
                  <FileText size={32} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-600">Document preview not available</p>
                  <p className="text-sm text-gray-500 mt-1">
                    In a full implementation, document preview would be shown here
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DocumentDetailsPage;
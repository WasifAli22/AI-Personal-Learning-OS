"use client";

import AppShell from "@/components/app-shell";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, X, Check, Loader2, AlertCircle } from "lucide-react";
import { useState, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { documentsAPI } from "@/services/api";

export default function UploadPage() {
  const [dragActive, setDragActive] = useState(false);
  const queryClient = useQueryClient();

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: documentsAPI.list,
    retry: false,
  });

  const uploadMutation = useMutation({
    mutationFn: documentsAPI.upload,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files);
    files.forEach((file) => uploadMutation.mutate(file));
  }, [uploadMutation]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => uploadMutation.mutate(file));
  };

  return (
    <AppShell>
      <div className="page-container">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="page-header">
          <h1 className="page-title">Upload <span className="gradient-text">Learning Materials</span></h1>
          <p className="page-subtitle">Upload PDFs, documents, or text files to start your personalized learning experience</p>
        </motion.div>

        {/* Drop Zone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer mb-8 ${
            dragActive
              ? "border-primary bg-primary/5 glow"
              : "border-border hover:border-primary/50 hover:bg-card/50"
          }`}
        >
          <input
            type="file"
            accept=".pdf,.txt,.docx,.md"
            multiple
            onChange={handleFileSelect}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          <div className="flex flex-col items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${
              dragActive ? "bg-primary/20" : "bg-secondary"
            }`}>
              <Upload className={`w-8 h-8 ${dragActive ? "text-primary" : "text-muted-foreground"}`} />
            </div>
            <div>
              <p className="text-lg font-semibold mb-1">
                {dragActive ? "Drop files here" : "Drag & drop files here"}
              </p>
              <p className="text-sm text-muted-foreground">
                or click to browse • PDF, DOCX, TXT, MD supported
              </p>
            </div>
            {uploadMutation.isPending && (
              <div className="flex items-center gap-2 text-primary">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Processing document...</span>
              </div>
            )}
            {uploadMutation.isError && (
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">Upload failed. Please try again.</span>
              </div>
            )}
            {uploadMutation.isSuccess && (
              <div className="flex items-center gap-2 text-success">
                <Check className="w-4 h-4" />
                <span className="text-sm">Document processed and embedded successfully!</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Document List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Uploaded Materials ({documents.length})
          </h2>
          {documents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {documents.map((doc: any, i: number) => (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.05 }}
                    className="glass-card p-5 group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-blue-400" />
                      </div>
                      <span className="text-[10px] px-2 py-1 rounded-md bg-secondary text-muted-foreground uppercase font-medium">
                        {doc.doc_type}
                      </span>
                    </div>
                    <h3 className="font-medium text-sm truncate mb-1">{doc.filename}</h3>
                    <p className="text-xs text-muted-foreground">
                      {doc.chunk_count} chunks embedded
                    </p>
                    <div className="flex items-center gap-1 mt-3">
                      <div className="flex-1 h-1 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-primary to-indigo-500 rounded-full w-full" />
                      </div>
                      <Check className="w-3 h-3 text-success" />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="glass-card p-12 text-center text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium mb-1">No documents uploaded yet</p>
              <p className="text-sm">Upload your first document to start learning with AI</p>
            </div>
          )}
        </motion.div>
      </div>
    </AppShell>
  );
}

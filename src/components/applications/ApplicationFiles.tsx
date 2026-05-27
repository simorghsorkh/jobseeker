"use client";

import { useEffect, useState, useRef } from "react";
import { Upload, File, Trash2, Download, FileText, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { uploadFile, deleteFile } from "@/lib/db/activities";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import type { ApplicationFile, FileCategory } from "@/lib/types";
import toast from "react-hot-toast";

const FILE_CATEGORIES: { value: FileCategory; label: string }[] = [
  { value: "resume", label: "Resume" },
  { value: "cover_letter", label: "Cover Letter" },
  { value: "certificate", label: "Certificate" },
  { value: "portfolio", label: "Portfolio" },
  { value: "assignment", label: "Assignment" },
  { value: "other", label: "Other" },
];

interface ApplicationFilesProps {
  applicationId: string;
}

export function ApplicationFiles({ applicationId }: ApplicationFilesProps) {
  const [files, setFiles] = useState<ApplicationFile[]>([]);
  const [category, setCategory] = useState<FileCategory>("resume");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("application_files")
      .select("*")
      .eq("application_id", applicationId)
      .order("created_at", { ascending: false })
      .then(({ data }) => setFiles(data || []));
  }, [applicationId]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File must be under 10MB");
      return;
    }
    setIsUploading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const uploaded = await uploadFile(file, applicationId, user.id, category);
      setFiles((prev) => [uploaded, ...prev]);
      toast.success("File uploaded");
    } catch {
      toast.error("Upload failed");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (file: ApplicationFile) => {
    await deleteFile(file.id, file.file_path);
    setFiles((prev) => prev.filter((f) => f.id !== file.id));
    toast.success("File deleted");
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  const FileIcon = ({ type }: { type: string | null }) => {
    if (type?.includes("image")) return <ImageIcon className="h-4 w-4 text-blue-500" />;
    if (type?.includes("pdf")) return <FileText className="h-4 w-4 text-red-500" />;
    return <File className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <div className="mt-4 space-y-4">
      {/* Upload area */}
      <div
        className="rounded-xl border-2 border-dashed border-border p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
        <p className="text-sm font-medium">Drop files here or click to upload</p>
        <p className="text-xs text-muted-foreground mt-1">PDF, DOC, DOCX, PNG, JPG up to 10MB</p>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt"
          onChange={handleFileSelect}
        />
      </div>

      <div className="flex items-center gap-2">
        <Select value={category} onValueChange={(v) => setCategory(v as FileCategory)}>
          <SelectTrigger className="h-8 text-xs w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FILE_CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          className="h-8 text-xs gap-1.5"
          isLoading={isUploading}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-3.5 w-3.5" />
          Upload
        </Button>
      </div>

      {/* Files list */}
      {files.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-8">No files uploaded yet</p>
      ) : (
        <div className="space-y-2">
          {files.map((file) => (
            <div key={file.id} className="flex items-center gap-3 rounded-lg border border-border p-3 bg-card">
              <FileIcon type={file.file_type} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {FILE_CATEGORIES.find((c) => c.value === file.category)?.label}
                  {file.file_size && ` · ${formatSize(file.file_size)}`}
                  {" · "}{formatDate(file.created_at)}
                </p>
              </div>
              <div className="flex gap-1">
                {file.file_url && (
                  <a href={file.file_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="icon-sm" className="h-7 w-7">
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                  </a>
                )}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(file)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import { useRef, useState } from "react";
import { UploadCloud, FileText, Trash2, CheckCircle2, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import api, { formatApiError } from "../lib/api";

const ALLOWED = ["jpg", "jpeg", "png", "pdf"];
const MAX_MB = 5;

export default function FileUpload({ applicationId, spec, doc, onChange }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  const validate = (file) => {
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    if (!ALLOWED.includes(ext)) {
      toast.error("Only JPG, JPEG, PNG and PDF files are allowed");
      return false;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(`File exceeds the ${MAX_MB}MB size limit`);
      return false;
    }
    return true;
  };

  const upload = async (file) => {
    if (!validate(file)) return;
    setUploading(true);
    setProgress(0);
    try {
      const fd = new FormData();
      fd.append("application_id", applicationId);
      fd.append("doc_type", spec.key);
      fd.append("file", file);
      const { data } = await api.post("/documents/upload", fd, {
        onUploadProgress: (e) => setProgress(Math.round((e.loaded * 100) / (e.total || 1))),
      });
      toast.success(`${spec.label} uploaded`);
      onChange(data);
    } catch (e) {
      toast.error(formatApiError(e, "Upload failed"));
    } finally {
      setUploading(false);
    }
  };

  const remove = async () => {
    try {
      const { data } = await api.delete(`/documents/${applicationId}/${spec.key}`);
      toast.success("Document removed");
      onChange(data);
    } catch (e) {
      toast.error(formatApiError(e, "Delete failed"));
    }
  };

  const isImage = doc && /\.(jpe?g|png)$/i.test(doc.file_name || "");
  const previewUrl = doc && doc.stored_name
    ? `${process.env.REACT_APP_BACKEND_URL}/api/documents/${applicationId}/${doc.stored_name}`
    : null;

  return (
    <div data-testid={`upload-${spec.key}`} className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-800">{spec.label}</span>
          <span data-testid={`upload-${spec.key}-badge`}
            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${spec.required ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-500"}`}>
            {spec.required ? "Required" : "Optional"}
          </span>
          {doc?.verified && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">Verified</span>
          )}
          {doc?.replacement_requested && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-50 text-orange-700">
              <AlertTriangle className="w-3 h-3" /> Re-upload needed
            </span>
          )}
        </div>
        {doc && (
          <button onClick={remove} data-testid={`upload-${spec.key}-delete`}
            className="p-1.5 text-slate-400 hover:text-red-600 transition-colors" aria-label="Delete document">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {doc ? (
        <div className="flex items-center gap-4">
          {isImage && previewUrl ? (
            <img src={previewUrl} alt={spec.label} className="w-14 h-14 rounded-xl object-cover border border-slate-200" />
          ) : (
            <span className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center">
              <FileText className="w-6 h-6 text-royal" />
            </span>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-800 truncate">{doc.file_name}</p>
            <p className="text-xs text-slate-500">{(doc.size / 1024).toFixed(0)} KB · Uploaded</p>
          </div>
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          <button onClick={() => inputRef.current?.click()} data-testid={`upload-${spec.key}-replace`}
            className="text-xs font-semibold text-royal hover:underline shrink-0">
            Replace
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) upload(f); }}
          onClick={() => !uploading && inputRef.current?.click()}
          data-testid={`upload-${spec.key}-dropzone`}
          className={`cursor-pointer border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-colors ${
            dragging ? "border-royal bg-blue-50" : "border-slate-300 hover:border-royal hover:bg-blue-50/50"
          }`}
        >
          {uploading ? (
            <>
              <Loader2 className="w-7 h-7 text-royal animate-spin mb-2" />
              <p className="text-sm font-medium text-slate-600">Uploading… {progress}%</p>
              <div className="w-40 h-1.5 bg-slate-200 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-royal rounded-full transition-[width]" style={{ width: `${progress}%` }} />
              </div>
            </>
          ) : (
            <>
              <UploadCloud className="w-7 h-7 text-slate-400 mb-2" />
              <p className="text-sm font-medium text-slate-600">Drag &amp; drop or <span className="text-royal font-semibold">browse</span></p>
              <p className="text-xs text-slate-400 mt-1">JPG, PNG or PDF · Max {MAX_MB}MB</p>
            </>
          )}
        </div>
      )}
      <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.pdf" className="hidden"
        data-testid={`upload-${spec.key}-input`}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }} />
    </div>
  );
}

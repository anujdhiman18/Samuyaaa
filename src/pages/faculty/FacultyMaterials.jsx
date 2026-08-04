import React, { useState, useEffect } from 'react';
import { facultyPanelService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/admin/Modal';

export default function FacultyMaterials() {
  const { addToast } = useToast();

  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  // Upload Modal State
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('Mathematics Advanced');
  const [className, setClassName] = useState('10th');
  const [fileUrl, setFileUrl] = useState('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf');
  const [fileType, setFileType] = useState('PDF');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const res = await facultyPanelService.getStudyMaterials();
      if (res && res.materials) {
        setMaterials(res.materials);
      }
    } catch (err) {
      console.warn('Error fetching materials:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      const res = await facultyPanelService.uploadStudyMaterial({
        title,
        description,
        subject,
        className,
        fileUrl,
        fileType,
      });

      if (res && res.success) {
        addToast('Study material published to students!', 'success');
        setUploadModalOpen(false);
        setTitle('');
        setDescription('');
        fetchMaterials();
      }
    } catch (err) {
      addToast('Error publishing study material', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await facultyPanelService.deleteStudyMaterial(id);
      addToast('Study material deleted', 'info');
      fetchMaterials();
    } catch (err) {
      addToast('Error deleting material', 'error');
    }
  };

  const getBadgeColor = (type) => {
    switch (type) {
      case 'PDF': return 'bg-rose-100 text-rose-800';
      case 'PPT': return 'bg-amber-100 text-amber-800';
      case 'Video': return 'bg-purple-100 text-purple-800';
      case 'Link': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-primary/10 text-primary';
    }
  };

  return (
    <div className="space-y-6 font-body">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-premium border border-outline-variant/15">
        <div>
          <h1 className="font-headings font-extrabold text-2xl md:text-3xl text-secondary flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl">folder_open</span>
            Study Materials Repository
          </h1>
          <p className="font-body text-xs text-on-surface-variant mt-1">
            Upload & share lecture slides (PPT), reference notes (PDF), video tutorials, & study links.
          </p>
        </div>

        <button
          onClick={() => setUploadModalOpen(true)}
          className="bg-primary text-white font-headings font-bold px-5 py-2.5 rounded-full text-xs flex items-center gap-1.5 shadow-premium hover:shadow-glow-primary active:scale-95 transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">upload_file</span>
          Upload Material
        </button>
      </div>

      {/* Materials List */}
      {loading ? (
        <div className="p-8 text-center text-xs animate-pulse text-on-surface-variant">
          Loading study materials...
        </div>
      ) : materials.length === 0 ? (
        <div className="p-12 text-center text-xs text-on-surface-variant bg-white rounded-2xl border border-outline-variant/15">
          No study materials uploaded yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {materials.map((m) => (
            <div
              key={m._id || m.id}
              className="bg-white p-6 rounded-2xl shadow-premium border border-outline-variant/15 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${getBadgeColor(m.fileType)}`}>
                    {m.fileType} Format
                  </span>
                  <span className="text-[10px] font-bold text-on-surface-variant">
                    {m.className} &bull; {m.subject}
                  </span>
                </div>
                <h3 className="font-headings font-extrabold text-base text-secondary">{m.title}</h3>
                <p className="text-xs text-on-surface-variant line-clamp-2">{m.description}</p>
              </div>

              <div className="pt-3 border-t border-outline-variant/15 flex items-center justify-between">
                <a
                  href={m.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-1.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-container shadow-sm flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                  Open {m.fileType}
                </a>
                <button
                  onClick={() => handleDelete(m._id || m.id)}
                  className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600 transition-colors"
                  title="Delete Resource"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <Modal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title="Upload Study Resource"
      >
        <form onSubmit={handleUpload} className="space-y-4 font-body">
          <div>
            <label className="block text-xs font-bold text-secondary mb-1">Resource Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs focus:outline-none focus:border-primary"
              placeholder="e.g. Calculus Board Exam Solved Notes"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-secondary mb-1">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs focus:outline-none focus:border-primary"
              placeholder="Brief description of the material..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-secondary mb-1">Class</label>
              <select
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs font-bold text-secondary focus:outline-none"
              >
                <option value="10th">Class 10th</option>
                <option value="11th (+1)">Class 11th (+1)</option>
                <option value="12th (+2)">Class 12th (+2)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-secondary mb-1">Subject</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs font-bold text-secondary focus:outline-none"
              >
                <option value="Mathematics Advanced">Mathematics Advanced</option>
                <option value="Physics IIT-JEE Prep">Physics IIT-JEE Prep</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-secondary mb-1">File Type</label>
              <select
                value={fileType}
                onChange={(e) => setFileType(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs font-bold text-secondary focus:outline-none"
              >
                <option value="PDF">PDF Document</option>
                <option value="PPT">PowerPoint Presentation (PPT)</option>
                <option value="Video">Video Tutorial Link</option>
                <option value="Document">Word Document</option>
                <option value="Link">External Web Link</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-secondary mb-1">File / Web Link URL</label>
              <input
                type="url"
                required
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs focus:outline-none focus:border-primary font-mono"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-outline-variant/15">
            <button
              type="button"
              onClick={() => setUploadModalOpen(false)}
              className="px-5 py-2.5 rounded-full border border-outline-variant/30 text-xs font-bold text-secondary hover:bg-surface-container"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="bg-primary text-white font-bold text-xs px-6 py-2.5 rounded-full shadow-premium hover:bg-primary-container disabled:opacity-50"
            >
              {uploading ? 'Publishing...' : 'Publish Material'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

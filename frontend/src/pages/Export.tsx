import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText, Book, Download, Loader2, Check, Clock, AlertCircle, Image, Mic, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Navigation } from '../components/Navigation';
import { exportApi } from '../services/api';

type ExportType = 'memories-pdf' | 'letters-pdf' | 'family-book';
type ExportStyle = 'classic' | 'modern' | 'elegant';

interface ExportJob {
  id: string;
  type: ExportType;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  downloadUrl?: string;
  createdAt: string;
  error?: string;
}

export function Export() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  
  const [selectedType, setSelectedType] = useState<ExportType | null>(null);
  const [exportOptions, setExportOptions] = useState({
    style: 'classic' as ExportStyle,
    includePhotos: true,
    includeLetters: true,
    includeVoice: true,
    includeFamilyTree: true,
    title: 'Our Family Legacy',
    dedication: '',
  });

  // Fetch export history
  const { data: historyData, isLoading: loadingHistory } = useQuery({
    queryKey: ['export-history'],
    queryFn: () => exportApi.getExportHistory().then((r: { data: { exports: ExportJob[] } }) => r.data),
  });

  // Generate memories PDF
  const memoriesPdfMutation = useMutation({
    mutationFn: (options: { style: ExportStyle; includePhotos: boolean; includeLetters: boolean; includeVoice: boolean }) =>
      exportApi.generateMemoriesPdf(options),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['export-history'] });
      setSelectedType(null);
    },
  });

  // Generate letters PDF
  const lettersPdfMutation = useMutation({
    mutationFn: (options: { style: ExportStyle }) =>
      exportApi.generateLettersPdf(options),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['export-history'] });
      setSelectedType(null);
    },
  });

  // Generate family book
  const familyBookMutation = useMutation({
    mutationFn: (options: { style: ExportStyle; title: string; dedication?: string; includePhotos: boolean; includeLetters: boolean; includeVoice: boolean; includeFamilyTree: boolean }) =>
      exportApi.generateFamilyBook(options),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['export-history'] });
      setSelectedType(null);
    },
  });

  const handleExport = () => {
    if (!selectedType) return;

    switch (selectedType) {
      case 'memories-pdf':
        memoriesPdfMutation.mutate({
          style: exportOptions.style,
          includePhotos: exportOptions.includePhotos,
          includeLetters: exportOptions.includeLetters,
          includeVoice: exportOptions.includeVoice,
        });
        break;
      case 'letters-pdf':
        lettersPdfMutation.mutate({
          style: exportOptions.style,
        });
        break;
      case 'family-book':
        familyBookMutation.mutate({
          style: exportOptions.style,
          title: exportOptions.title,
          dedication: exportOptions.dedication,
          includePhotos: exportOptions.includePhotos,
          includeLetters: exportOptions.includeLetters,
          includeVoice: exportOptions.includeVoice,
          includeFamilyTree: exportOptions.includeFamilyTree,
        });
        break;
    }
  };

  const isExporting = memoriesPdfMutation.isPending || lettersPdfMutation.isPending || familyBookMutation.isPending;

  const exportTypes = [
    {
      id: 'memories-pdf' as ExportType,
      title: 'Memories PDF',
      description: 'Export all your memories, photos, and voice transcripts as a beautiful PDF document.',
      icon: Image,
      features: ['Photos', 'Voice transcripts', 'Captions & dates'],
    },
    {
      id: 'letters-pdf' as ExportType,
      title: 'Letters PDF',
      description: 'Compile all your letters into a single PDF, perfect for printing or sharing.',
      icon: Mail,
      features: ['All letters', 'Scheduled & sent', 'Formatted text'],
    },
    {
      id: 'family-book' as ExportType,
      title: 'Family Book',
      description: 'Create a comprehensive family legacy book with cover, dedication, and all content.',
      icon: Book,
      features: ['Custom cover', 'Table of contents', 'Family tree', 'All memories & letters'],
    },
  ];

  const styles: { id: ExportStyle; name: string; description: string }[] = [
    { id: 'classic', name: 'Classic', description: 'Traditional, elegant design with serif fonts' },
    { id: 'modern', name: 'Modern', description: 'Clean, minimalist design with sans-serif fonts' },
    { id: 'elegant', name: 'Elegant', description: 'Sophisticated design with decorative elements' },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <Check className="w-5 h-5 text-green-400" />;
      case 'processing':
      case 'pending':
        return <Loader2 className="w-5 h-5 text-gold animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      default:
        return <Clock className="w-5 h-5 text-paper/40" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'memories-pdf':
        return 'Memories PDF';
      case 'letters-pdf':
        return 'Letters PDF';
      case 'family-book':
        return 'Family Book';
      default:
        return type;
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Sanctuary Background */}
      <div className="sanctuary-bg">
        <div className="sanctuary-orb sanctuary-orb-1" />
        <div className="sanctuary-orb sanctuary-orb-2" />
        <div className="sanctuary-orb sanctuary-orb-3" />
        <div className="sanctuary-stars" />
        <div className="sanctuary-mist" />
      </div>

      <Navigation />

      <div className="relative z-10 px-6 md:px-12 py-12">
        <button 
          onClick={() => navigate('/dashboard')} 
          className="flex items-center gap-2 text-paper/40 hover:text-gold transition-colors mb-8"
        >
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>

        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-light mb-4">Export Your Legacy</h1>
          <p className="text-paper/60 mb-8">
            Create beautiful PDFs and books from your memories, letters, and family history.
          </p>

          {/* Export Type Selection */}
          {!selectedType && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {exportTypes.map((type) => (
                  <motion.div
                    key={type.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card hover:border-gold/30 transition-all cursor-pointer"
                    onClick={() => setSelectedType(type.id)}
                  >
                    <type.icon className="w-10 h-10 text-gold mb-4" />
                    <h3 className="text-lg font-medium mb-2">{type.title}</h3>
                    <p className="text-sm text-paper/60 mb-4">{type.description}</p>
                    <ul className="space-y-1">
                      {type.features.map((feature) => (
                        <li key={feature} className="text-xs text-paper/40 flex items-center gap-2">
                          <Check size={12} className="text-gold" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                ))}
              </div>

              {/* Export History */}
              <div>
                <h2 className="text-2xl font-light mb-6">Export History</h2>
                {loadingHistory ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-gold" />
                  </div>
                ) : historyData?.exports?.length === 0 ? (
                  <div className="text-center py-8 text-paper/40">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No exports yet. Create your first export above!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {historyData?.exports?.map((job: ExportJob) => (
                      <motion.div
                        key={job.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="card flex items-center justify-between"
                      >
                        <div className="flex items-center gap-4">
                          {getStatusIcon(job.status)}
                          <div>
                            <h4 className="font-medium">{getTypeLabel(job.type)}</h4>
                            <p className="text-sm text-paper/40">
                              {new Date(job.createdAt).toLocaleDateString()} at{' '}
                              {new Date(job.createdAt).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {job.status === 'processing' && job.progress !== undefined && (
                            <div className="w-24 h-2 bg-void rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gold transition-all"
                                style={{ width: `${job.progress}%` }}
                              />
                            </div>
                          )}
                          {job.status === 'completed' && job.downloadUrl && (
                            <a
                              href={job.downloadUrl}
                              download
                              className="btn-secondary text-sm flex items-center gap-2"
                            >
                              <Download size={14} />
                              Download
                            </a>
                          )}
                          {job.status === 'failed' && (
                            <span className="text-sm text-red-400">{job.error || 'Export failed'}</span>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Export Options */}
          {selectedType && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <button
                onClick={() => setSelectedType(null)}
                className="flex items-center gap-2 text-paper/60 hover:text-gold mb-6"
              >
                <ArrowLeft size={18} />
                Back to export types
              </button>

              <div className="card">
                <h2 className="text-2xl font-light mb-6">
                  {exportTypes.find(t => t.id === selectedType)?.title} Options
                </h2>

                {/* Style Selection */}
                <div className="mb-6">
                  <label className="block text-sm text-paper/60 mb-3">Style</label>
                  <div className="grid grid-cols-3 gap-4">
                    {styles.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => setExportOptions({ ...exportOptions, style: style.id })}
                        className={`p-4 rounded-lg border transition-all text-left ${
                          exportOptions.style === style.id
                            ? 'border-gold bg-gold/10'
                            : 'border-paper/10 hover:border-paper/30'
                        }`}
                      >
                        <h4 className="font-medium mb-1">{style.name}</h4>
                        <p className="text-xs text-paper/40">{style.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Family Book Options */}
                {selectedType === 'family-book' && (
                  <>
                    <div className="mb-6">
                      <label className="block text-sm text-paper/60 mb-2">Book Title</label>
                      <input
                        type="text"
                        value={exportOptions.title}
                        onChange={(e) => setExportOptions({ ...exportOptions, title: e.target.value })}
                        className="input"
                        placeholder="Our Family Legacy"
                      />
                    </div>
                    <div className="mb-6">
                      <label className="block text-sm text-paper/60 mb-2">Dedication (optional)</label>
                      <textarea
                        value={exportOptions.dedication}
                        onChange={(e) => setExportOptions({ ...exportOptions, dedication: e.target.value })}
                        className="input min-h-[100px]"
                        placeholder="To our children and grandchildren..."
                      />
                    </div>
                  </>
                )}

                {/* Content Options */}
                {(selectedType === 'memories-pdf' || selectedType === 'family-book') && (
                  <div className="mb-6">
                    <label className="block text-sm text-paper/60 mb-3">Include Content</label>
                    <div className="space-y-3">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={exportOptions.includePhotos}
                          onChange={(e) => setExportOptions({ ...exportOptions, includePhotos: e.target.checked })}
                          className="w-5 h-5 rounded border-paper/30 bg-void text-gold focus:ring-gold"
                        />
                        <span className="flex items-center gap-2">
                          <Image size={16} className="text-paper/40" />
                          Photos
                        </span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={exportOptions.includeLetters}
                          onChange={(e) => setExportOptions({ ...exportOptions, includeLetters: e.target.checked })}
                          className="w-5 h-5 rounded border-paper/30 bg-void text-gold focus:ring-gold"
                        />
                        <span className="flex items-center gap-2">
                          <Mail size={16} className="text-paper/40" />
                          Letters
                        </span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={exportOptions.includeVoice}
                          onChange={(e) => setExportOptions({ ...exportOptions, includeVoice: e.target.checked })}
                          className="w-5 h-5 rounded border-paper/30 bg-void text-gold focus:ring-gold"
                        />
                        <span className="flex items-center gap-2">
                          <Mic size={16} className="text-paper/40" />
                          Voice Transcripts
                        </span>
                      </label>
                      {selectedType === 'family-book' && (
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={exportOptions.includeFamilyTree}
                            onChange={(e) => setExportOptions({ ...exportOptions, includeFamilyTree: e.target.checked })}
                            className="w-5 h-5 rounded border-paper/30 bg-void text-gold focus:ring-gold"
                          />
                          <span className="flex items-center gap-2">
                            <Book size={16} className="text-paper/40" />
                            Family Tree
                          </span>
                        </label>
                      )}
                    </div>
                  </div>
                )}

                {/* Export Button */}
                <button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {isExporting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Creating Export...
                    </>
                  ) : (
                    <>
                      <FileText size={18} />
                      Create {exportTypes.find(t => t.id === selectedType)?.title}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Export;

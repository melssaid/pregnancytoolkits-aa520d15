import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Camera, Upload, Trash2, Download, Sparkles, ChevronLeft, ChevronRight, 
  Loader2, Image as ImageIcon, HardDrive, AlertTriangle, Shield, 
  Calendar, X, RefreshCw, Info, Columns, Clock, Edit3, Check, Crown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { BumpPhotoService } from '@/services/localStorageServices';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useSmartChat, type ChatMessage } from '@/hooks/useSmartChat';
import { useAIUsage } from '@/contexts/AIUsageContext';
import { useResetOnLanguageChange } from '@/hooks/useResetOnLanguageChange';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { PrintableReport } from '@/components/PrintableReport';
import { ToolFrame } from '@/components/ToolFrame';
import { UltrasoundAbbreviationsGuide } from '@/components/UltrasoundAbbreviationsGuide';
import { useLanguage } from '@/contexts/LanguageContext';
import { compressImage, estimateDataUrlSize, formatBytes } from '@/lib/imageCompression';
import { triggerUpgradeBanner } from '@/components/TrialExpiryBanner';
import { MiniUsageBar } from '@/components/ai/MiniUsageBar';

interface BumpPhoto {
  id: string;
  week: number;
  caption: string | null;
  image_ref: string;
  storage_path: string;
  ai_analysis: string | null;
  created_at: string;
  updated_at: string;
}

const MAX_FILE_SIZE_MB = 2;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const AIBumpPhotos: React.FC = () => {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const { profile: userProfile } = useUserProfile();

  // Contextual trigger: opening the Sonar tool is a high-intent moment
  useEffect(() => {
    triggerUpgradeBanner("sonar_opened");
  }, []);
  const [photos, setPhotos] = useState<BumpPhoto[]>([]);
  const [currentWeek, setCurrentWeek] = useState(userProfile.pregnancyWeek || 0);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<BumpPhoto | null>(null);
  const [comparePhoto, setComparePhoto] = useState<BumpPhoto | null>(null);
  const [caption, setCaption] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [storageUsed, setStorageUsed] = useState(0);
  const [isExportingPhotos, setIsExportingPhotos] = useState(false);
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);
  const [editCaption, setEditCaption] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef(false);
  const { toast } = useToast();
  const { sendChat, isLoading: isSmartLoading } = useSmartChat({
    section: "bump-photos",
    toolType: "bump-photos",
  });
  const { isLimitReached, remaining } = useAIUsage();

  useResetOnLanguageChange(() => { setAiAnalysis(''); });
  // Sync week from central profile
  useEffect(() => {
    if (userProfile.pregnancyWeek) setCurrentWeek(userProfile.pregnancyWeek);
  }, [userProfile.pregnancyWeek]);

  // Calculate storage usage
  const storageInfo = useMemo(() => {
    const totalBytes = photos.reduce((sum, p) => sum + estimateDataUrlSize(p.image_ref), 0);
    const maxStorage = 5 * 1024 * 1024;
    const percentage = Math.min(100, (totalBytes / maxStorage) * 100);
    return { used: formatBytes(totalBytes), percentage, isWarning: percentage > 70, isCritical: percentage > 90 };
  }, [photos]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const loadedPhotos = await BumpPhotoService.getAll();
      setPhotos(loadedPhotos);
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast({
        title: t('toolsInternal.bumpPhotos.loadingError'),
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Upload is always allowed (quota is checked at AI analysis time)
    if (!file.type.startsWith('image/')) {
      toast({
        title: t('toolsInternal.kickCounter.error'),
        description: t('toolsInternal.bumpPhotos.errorSelectImage'),
        variant: 'destructive'
      });
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast({
        title: t('toolsInternal.bumpPhotos.imageSizeLimitTitle'),
        description: t('toolsInternal.bumpPhotos.imageSizeLimitDesc'),
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsUploading(true);
      
      // Read and compress image
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Compress image for local storage
      const compressedDataUrl = await compressImage(dataUrl, 800, 1000, 0.7);
      
      // Create photo object with compressed image directly
      const photo: BumpPhoto = {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        week: currentWeek,
        caption: caption || null,
        image_ref: compressedDataUrl,
        storage_path: `local/${currentWeek}_${Date.now()}`,
        ai_analysis: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Save to local storage directly (avoid double processing)
      const existingPhotos = await BumpPhotoService.getAll();
      const updatedPhotos = [...existingPhotos, photo].sort((a, b) => a.week - b.week);
      localStorage.setItem(`bump_photos_${localStorage.getItem('pregnancy_user_id')}`, JSON.stringify(updatedPhotos));
      
      setPhotos(updatedPhotos);
      setCaption('');
      
      toast({
        title: t('toolsInternal.bumpPhotos.photoSaved'),
        description: t('toolsInternal.bumpPhotos.photoSavedDesc', { week: currentWeek })
      });

      // Select latest photo so user can press the explicit "Analyze" button
      setSelectedPhoto(photo);
      
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: t('toolsInternal.bumpPhotos.uploadFailed'),
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleEditCaption = async (photoId: string) => {
    try {
      await BumpPhotoService.updateCaption(photoId, editCaption);
      setPhotos(prev => prev.map(p => 
        p.id === photoId ? { ...p, caption: editCaption } : p
      ));
      if (selectedPhoto?.id === photoId) {
        setSelectedPhoto({ ...selectedPhoto, caption: editCaption });
      }
      setEditingPhotoId(null);
      setEditCaption('');
      toast({
        title: t('toolsInternal.bumpPhotos.captionUpdated'),
        description: t('toolsInternal.bumpPhotos.captionUpdatedDesc')
      });
    } catch (error: any) {
      toast({
        title: t('toolsInternal.bumpPhotos.updateFailed'),
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const analyzePhoto = async (photo: BumpPhoto) => {
    if (isLimitReached) {
      toast({
        title: t('aiErrors.monthlyLimitTitle', 'Monthly limit reached'),
        description: t('quotaExhausted.upgradeHint', 'Upgrade to Premium for more insights'),
      });
      return;
    }
    try {
      setIsAnalyzing(true);
      setSelectedPhoto(photo);
      setAiAnalysis('');
      abortRef.current = false;
      
      const previousPhoto = photos.find(p => p.week < photo.week);
      
      const textPrompt = previousPhoto 
        ? `I am in week ${photo.week} of pregnancy (previous photo was at week ${previousPhoto.week}). Please analyze this bump photo and provide educational observations about what is visible, baby's development at this stage, and any notable features.`
        : `I am in week ${photo.week} of pregnancy. Please analyze this bump photo and provide educational observations about what is visible, baby's development at this stage, and any notable features.`;

      // Build multimodal message with bump photo
      const messageContent: ChatMessage = {
        role: 'user',
        content: [
          { type: "text", text: textPrompt },
          { type: "image_url", image_url: { url: photo.image_ref } },
        ],
      };

      let fullResponse = '';
      
      await sendChat({
        messages: [messageContent],
        context: { week: photo.week },
        onDelta: (text) => {
          if (abortRef.current) return;
          fullResponse += text;
          setAiAnalysis(fullResponse);
        },
        onDone: async () => {
          if (!abortRef.current && fullResponse) {
            await BumpPhotoService.updateAnalysis(photo.id, fullResponse);
            setPhotos(prev => prev.map(p => 
              p.id === photo.id ? { ...p, ai_analysis: fullResponse } : p
            ));
          }
          setIsAnalyzing(false);
        },
      });
      
    } catch (error: any) {
      console.error('Analysis error:', error);
      toast({
        title: t('toolsInternal.bumpPhotos.analysisFailedTitle'),
        description: error.message,
        variant: 'destructive'
      });
      setIsAnalyzing(false);
    }
  };

  const handleDelete = async (photo: BumpPhoto) => {
    if (!confirm(t('toolsInternal.bumpPhotos.deleteConfirm'))) return;

    try {
      await BumpPhotoService.delete(photo.id, photo.storage_path);
      setPhotos(prev => prev.filter(p => p.id !== photo.id));
      
      if (selectedPhoto?.id === photo.id) {
        setSelectedPhoto(null);
        setAiAnalysis('');
      }
      
      toast({
        title: t('toolsInternal.bumpPhotos.photoDeleted'),
        description: t('toolsInternal.bumpPhotos.deletedDesc')
      });
    } catch (error: any) {
      toast({
        title: t('toolsInternal.bumpPhotos.deleteFailed'),
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleDownload = (photo: BumpPhoto) => {
    const link = document.createElement('a');
    link.href = photo.image_ref;
    link.download = `bump-week-${photo.week}.jpg`;
    link.click();
  };

  const handleShare = async (photo: BumpPhoto) => {
    try {
      // Convert base64 to blob
      const response = await fetch(photo.image_ref);
      const blob = await response.blob();
      const file = new File([blob], `bump-week-${photo.week}.jpg`, { type: 'image/jpeg' });
      
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `${t('toolsInternal.bumpPhotos.week')} ${photo.week}`,
          text: photo.caption || `${t('toolsInternal.bumpPhotos.subtitle')} - ${t('toolsInternal.bumpPhotos.week')} ${photo.week}`,
          files: [file]
        });
      } else {
        // Fallback to download
        handleDownload(photo);
        toast({ title: t('toolsInternal.bumpPhotos.photoDownloaded'), description: t('toolsInternal.bumpPhotos.photoDownloadedDesc') });
      }
    } catch (error) {
      console.error('Share error:', error);
      handleDownload(photo);
    }
  };

  const handleExportAllPhotos = async () => {
    if (photos.length === 0) return;
    setIsExportingPhotos(true);
    try {
      // Download each photo individually with a small delay
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        const link = document.createElement('a');
        
        // Handle both blob URLs and data URLs
        if (photo.image_ref.startsWith('blob:') || photo.image_ref.startsWith('data:')) {
          link.href = photo.image_ref;
        } else {
          // Try to fetch and create blob URL
          try {
            const resp = await fetch(photo.image_ref);
            const blob = await resp.blob();
            link.href = URL.createObjectURL(blob);
          } catch {
            link.href = photo.image_ref;
          }
        }

        const weekStr = String(photo.week).padStart(2, '0');
        link.download = `bump-week-${weekStr}-${i + 1}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Small delay between downloads to avoid browser blocking
        if (i < photos.length - 1) {
          await new Promise(r => setTimeout(r, 500));
        }
      }
      
      toast({
        title: isRTL ? 'تم تصدير الصور بنجاح ✅' : 'Photos exported successfully ✅',
        description: isRTL
          ? `تم تحميل ${photos.length} صورة إلى جهازك`
          : `${photos.length} photos downloaded to your device`,
      });
    } catch (error: any) {
      console.error('Export error:', error);
      toast({
        title: isRTL ? 'فشل التصدير' : 'Export failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsExportingPhotos(false);
    }
  };

  if (isLoading) {
    return (
      <ToolFrame
        title={t('toolsInternal.bumpPhotos.title')}
        subtitle={t('toolsInternal.bumpPhotos.subtitle')}
        mood="nurturing"
        toolId="ai-bump-photos"
      >
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </ToolFrame>
    );
  }

  return (
    <ToolFrame
      title={t('toolsInternal.bumpPhotos.title')}
      subtitle={`${t('toolsInternal.common.week')} ${currentWeek} - ${t('toolsInternal.bumpPhotos.subtitle')}`}
      mood="nurturing"
      toolId="ai-bump-photos"
    >
      <div className="space-y-6">

        {/* ──────────── PRO ANALYSIS BADGE ──────────── */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-accent/40 px-3.5 py-3"
        >
          {/* subtle sheen */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-foreground/[0.03] to-transparent" />
          <div className="relative flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[13px] font-extrabold text-foreground leading-tight">
                  {isRTL ? 'تحليل احترافي عميق للسونار' : 'Pro Ultrasound Analysis'}
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-primary/15 text-primary text-[10px] font-bold">
                  <Crown className="w-2.5 h-2.5" />
                  {isRTL ? '٥ نقاط' : '5 pts'}
                </span>
              </div>
              <p className="text-[10.5px] text-muted-foreground mt-0.5 leading-snug">
                {isRTL
                  ? 'قراءة بصرية متعددة الأقسام: ملاحظات، قياسات، تطور، وأسئلة لطبيبك'
                  : 'Multi-section visual reading: observations, measurements, milestones & doctor questions'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* ──────────── 1. UPLOAD SECTION ──────────── */}
        <Card className="border-primary/20 overflow-hidden">
          {/* Decorative accent bar */}
          <div className="h-1 bg-gradient-to-r from-primary/40 via-primary/60 to-primary/40" />
          
          <CardContent className="p-4 space-y-4">
            {/* Week Selector */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                <span className="font-medium">{t('toolsInternal.bumpPhotos.selectWeek')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentWeek(w => Math.max(1, w - 1))}
                >
                  {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </Button>
                <span className="text-base font-bold text-primary min-w-[60px] text-center">
                  {currentWeek}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentWeek(w => Math.min(42, w + 1))}
                >
                  {isRTL ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            
            {/* Caption */}
            <Textarea
              placeholder={t('toolsInternal.bumpPhotos.captionPlaceholder')}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="resize-none"
              rows={2}
            />
            
            {/* Upload Zone */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleUpload}
              className="hidden"
            />
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              onChange={handleUpload}
              className="hidden"
            />

            {isUploading ? (
              <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 border-primary/30 bg-primary/5">
                <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
                <span className="text-primary font-medium mt-2 block">{t('toolsInternal.bumpPhotos.compressing')}</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {/* Camera Button */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-5 transition-colors border-primary/30 bg-primary/5 hover:bg-primary/10 cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="p-3 rounded-full bg-primary/10 mb-2">
                    <Camera className="w-7 h-7 text-primary" />
                  </div>
                  <span className="text-primary font-medium text-sm">{t('toolsInternal.bumpPhotos.takePhoto')}</span>
                </motion.div>

                {/* Gallery Upload Button */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-5 transition-colors border-primary/30 bg-primary/5 hover:bg-primary/10 cursor-pointer"
                  onClick={() => galleryInputRef.current?.click()}
                >
                  <div className="p-3 rounded-full bg-primary/10 mb-2">
                    <ImageIcon className="w-7 h-7 text-primary" />
                  </div>
                  <span className="text-primary font-medium text-sm">{t('toolsInternal.bumpPhotos.uploadFromGallery')}</span>
                </motion.div>
              </div>
            )}

            {/* Persistent Analyze Button — visible before & after upload */}
            {(() => {
              const target = selectedPhoto || photos[photos.length - 1] || null;
              const canAnalyze = !!target && !isAnalyzing && !isUploading && !isLimitReached;
              return (
                <Button
                  onClick={() => target && analyzePhoto(target)}
                  disabled={!canAnalyze}
                  className="w-full h-12 rounded-xl text-sm font-bold gap-2 bg-gradient-to-r from-primary via-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:opacity-95 transition-all disabled:opacity-50 disabled:shadow-none"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t('toolsInternal.bumpPhotos.analyzing', 'Analyzing…')}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      {target
                        ? t('toolsInternal.bumpPhotos.analyzePhotoCta', 'Analyze photo')
                        : t('toolsInternal.bumpPhotos.addPhotoFirst', 'Add a photo to analyze')}
                    </>
                  )}
                </Button>
              );
            })()}

            {/* Plan-bound usage bar */}
            <MiniUsageBar toolType="bump-photos" section="bump-photos" />

            {/* Upgrade CTA when quota exhausted */}
            <div className="pt-1 space-y-2">
              {isLimitReached && (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-destructive">
                    {t('aiErrors.monthlyLimitTitle', 'Monthly limit reached')}
                  </span>
                </div>
              )}
              {isLimitReached && (
                <button
                  onClick={() => { window.location.href = '/pricing-demo'; }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-white text-xs font-semibold transition-all"
                  style={{
                    background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(340 55% 50%) 50%, hsl(280 45% 45%) 100%)',
                    boxShadow: '0 4px 16px -2px hsl(var(--primary) / 0.25)',
                  }}
                >
                  <Crown className="w-4 h-4" />
                  {t('quotaExhausted.unlockMore', 'Unlock more analyses with Premium')}
                </button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ──────────── BACKUP / EXPORT ALL PHOTOS ──────────── */}
        {photos.length > 0 && (
          <Card className="border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm font-semibold">
                      {isRTL ? 'نسخ احتياطي للصور' : 'Backup Photos'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isRTL
                        ? `${photos.length} صورة محفوظة — صدّرها قبل مسح البيانات`
                        : `${photos.length} photos saved — export before clearing data`}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  disabled={isExportingPhotos}
                  onClick={handleExportAllPhotos}
                >
                  {isExportingPhotos ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  {isRTL ? 'تصدير الكل' : 'Export All'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ──────────── 2. PHOTOS GRID ──────────── */}
        {photos.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {photos.map((photo, index) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className={`overflow-hidden cursor-pointer transition-all hover:shadow-lg ${
                    selectedPhoto?.id === photo.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => {
                    setSelectedPhoto(photo);
                    setAiAnalysis(photo.ai_analysis || '');
                  }}
                >
                  <div className="relative aspect-[3/4]">
                    <img
                      src={photo.image_ref}
                      alt={`Week ${photo.week}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs font-bold shadow">
                      {t('toolsInternal.bumpPhotos.week')} {photo.week}
                    </div>
                    {photo.ai_analysis && (
                      <div className="absolute top-2 left-2 bg-emerald-500 text-white p-1 rounded-full shadow">
                        <Sparkles className="w-3 h-3" />
                      </div>
                    )}
                    
                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(photo);
                        }}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(photo);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="p-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(photo.created_at).toLocaleDateString()}
                      </span>
                      <Badge variant="outline" className="text-[10px]">
                        <HardDrive className="w-2 h-2 mr-1" />
                        {t('toolsInternal.bumpPhotos.localLabel')}
                      </Badge>
                    </div>
                    
                    {/* Editable Caption */}
                    {editingPhotoId === photo.id ? (
                      <div className="mt-2 flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editCaption}
                          onChange={(e) => setEditCaption(e.target.value)}
                          placeholder={t('toolsInternal.bumpPhotos.addCaption')}
                          className="flex-1 text-xs p-1.5 border border-border rounded bg-background"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleEditCaption(photo.id);
                            } else if (e.key === 'Escape') {
                              setEditingPhotoId(null);
                              setEditCaption('');
                            }
                          }}
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditCaption(photo.id);
                          }}
                        >
                          <Check className="w-3 h-3 text-primary" />
                        </Button>
                      </div>
                    ) : (
                      <div 
                        className="mt-1 flex items-start gap-1 group cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingPhotoId(photo.id);
                          setEditCaption(photo.caption || '');
                        }}
                      >
                        {photo.caption ? (
                          <p className="text-xs text-muted-foreground line-clamp-2 flex-1">
                            {photo.caption}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground/50 italic flex-1">
                            {t('toolsInternal.bumpPhotos.addCaption')}
                          </p>
                        )}
                        <Edit3 className="w-3 h-3 text-muted-foreground/50 group-hover:text-primary flex-shrink-0 mt-0.5" />
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <ImageIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
              <h3 className="font-medium text-foreground mb-1">{t('toolsInternal.bumpPhotos.noPhotos')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('toolsInternal.bumpPhotos.startDocumenting', { week: currentWeek })}
              </p>
            </CardContent>
          </Card>
        )}

        {/* ──────────── 3. AI ANALYSIS PANEL ──────────── */}
        <AnimatePresence>
          {selectedPhoto && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              <Card className="bg-gradient-to-br from-primary/5 to-secondary/10 border-primary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-base">
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      {t('toolsInternal.bumpPhotos.aiAnalysisWeek', { week: selectedPhoto.week })}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => analyzePhoto(selectedPhoto)}
                      disabled={isAnalyzing}
                    >
                      {isAnalyzing ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <RefreshCw className="w-4 h-4 mr-2" />
                      )}
                      {isAnalyzing ? t('toolsInternal.bumpPhotos.analyzing') : t('toolsInternal.bumpPhotos.refresh')}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedPhoto.caption && (
                    <div className="mb-4 p-3 bg-background/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">💬 {selectedPhoto.caption}</p>
                    </div>
                  )}
                  
                  {aiAnalysis ? (
                    <>
                      <div className="bg-background/50 rounded-xl p-4">
                        <MarkdownRenderer content={aiAnalysis} />
                      </div>
                      <div className="mt-4">
                        <UltrasoundAbbreviationsGuide />
                      </div>
                      <PrintableReport
                        historyBucket="sonar"
                        title={
                          isRTL
                            ? `تقرير تحليل السونار — الأسبوع ${selectedPhoto.week}`
                            : `Ultrasound Analysis Report — Week ${selectedPhoto.week}`
                        }
                        downloadLabel={
                          isRTL
                            ? '📄 تحميل تقرير PDF لزيارة الطبيب'
                            : '📄 Download PDF for Doctor Visit'
                        }
                        downloadHint={
                          isRTL
                            ? 'تقرير منسّق احترافياً يتضمّن الصورة والتحليل الكامل'
                            : 'Professionally formatted report with the image and full analysis'
                        }
                      >
                        <div className="markdown-content">
                          {/* Doctor visit header context */}
                          <div style={{ marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
                            <table style={{ width: '100%', fontSize: '14px' }}>
                              <tbody>
                                <tr>
                                  <td><strong>{isRTL ? 'الأسبوع:' : 'Week:'}</strong> {selectedPhoto.week}</td>
                                  <td><strong>{isRTL ? 'التاريخ:' : 'Date:'}</strong> {new Date(selectedPhoto.created_at).toLocaleDateString(isRTL ? 'ar' : 'en-US')}</td>
                                </tr>
                              </tbody>
                            </table>
                            {selectedPhoto.caption && (
                              <p style={{ marginTop: '8px', fontSize: '14px' }}>
                                <strong>{isRTL ? 'ملاحظات:' : 'Notes:'}</strong> {selectedPhoto.caption}
                              </p>
                            )}
                          </div>

                          {/* Ultrasound image */}
                          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                            <img
                              src={selectedPhoto.image_ref}
                              alt={`Ultrasound week ${selectedPhoto.week}`}
                              style={{
                                maxWidth: '100%',
                                maxHeight: '380px',
                                borderRadius: '8px',
                                display: 'inline-block',
                              }}
                            />
                          </div>

                          {/* AI analysis */}
                          <MarkdownRenderer content={aiAnalysis} />
                        </div>
                      </PrintableReport>
                    </>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <Sparkles className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
                      <p>{t('toolsInternal.bumpPhotos.clickRefresh')}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>


        {/* ──────────── 5. PROGRESS TIMELINE ──────────── */}
        {photos.length > 1 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                {t('toolsInternal.bumpPhotos.journeyTimeline')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex overflow-x-auto gap-4 pb-2 -mx-2 px-2">
                {photos.map((photo, index) => (
                  <motion.div
                    key={photo.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex-shrink-0 text-center cursor-pointer transition-all ${
                      selectedPhoto?.id === photo.id ? 'scale-110' : 'hover:scale-105'
                    }`}
                    onClick={() => {
                      setSelectedPhoto(photo);
                      setAiAnalysis(photo.ai_analysis || '');
                    }}
                  >
                    <div className={`relative ${
                      selectedPhoto?.id === photo.id ? 'ring-2 ring-primary ring-offset-2' : ''
                    } rounded-full`}>
                      <img
                        src={photo.image_ref}
                        alt={`Week ${photo.week}`}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                      {photo.ai_analysis && (
                        <div className="absolute -top-1 -right-1 bg-emerald-500 text-white p-0.5 rounded-full">
                          <Sparkles className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs mt-1 font-medium">{t('toolsInternal.bumpPhotos.week')} {photo.week}</p>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ──────────── 6. INFO & TIPS ──────────── */}
        <div className="space-y-3">
          {/* Usage info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 rounded-2xl bg-gradient-to-br from-primary/[0.04] via-card to-accent/[0.03] border border-border/60 space-y-3"
          >
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-foreground">{t('toolsInternal.bumpPhotos.dailyLimitTitle')}</span>
            </div>
            <p 
              className="text-[11px] text-muted-foreground leading-relaxed"
              dangerouslySetInnerHTML={{ __html: t('toolsInternal.bumpPhotos.dailyLimitDesc') }}
            />
            {/* Storage bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-muted-foreground">{t('toolsInternal.bumpPhotos.storageUsed')}</span>
                <span className={`font-medium ${
                  storageInfo.isCritical ? 'text-destructive' : 
                  storageInfo.isWarning ? 'text-amber-600' : 'text-primary'
                }`}>
                  {storageInfo.used} / 5 MB
                </span>
              </div>
              <Progress value={storageInfo.percentage} className="h-1.5" />
            </div>
            
            <div className="border-t border-border/40" />
            
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {t('toolsInternal.bumpPhotos.localStorageWarning')}
              </p>
            </div>
          </motion.div>

          {/* Tips */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200/40">
            <div className="flex items-start gap-3">
              <Info className="w-4.5 h-4.5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-800 dark:text-amber-300 text-sm mb-1">{t('toolsInternal.bumpPhotos.photoTipsTitle')}</h4>
                <ul className="text-xs text-amber-700 dark:text-amber-400 space-y-0.5">
                  <li>• {t('toolsInternal.bumpPhotos.photoTip1')}</li>
                  <li>• {t('toolsInternal.bumpPhotos.photoTip2')}</li>
                  <li>• {t('toolsInternal.bumpPhotos.photoTip3')}</li>
                  <li>• {t('toolsInternal.bumpPhotos.photoTip4')}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Viewer */}
      <AnimatePresence>
        {showFullscreen && selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
            onClick={() => setShowFullscreen(false)}
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-white hover:bg-white/20"
              onClick={() => setShowFullscreen(false)}
            >
              <X className="w-6 h-6" />
            </Button>
            <div className="absolute top-4 left-4 text-white">
              <Badge className="bg-white/20">{t('common.week')} {selectedPhoto.week}</Badge>
            </div>
            <img
              src={selectedPhoto.image_ref}
              alt={`${t('common.week')} ${selectedPhoto.week}`}
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </ToolFrame>
  );
};

export default AIBumpPhotos;

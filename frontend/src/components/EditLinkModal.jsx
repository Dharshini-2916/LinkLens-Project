import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Link2, Calendar, Tag, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useUpdateLink } from '@/hooks/useLinks';
import dayjs from 'dayjs';

const editLinkSchema = z.object({
  originalUrl: z.string().url('Please enter a valid URL (e.g., https://example.com)'),
  customAlias: z.string()
    .regex(/^[a-zA-Z0-9_-]*$/, 'Only letters, numbers, hyphens, and underscores')
    .max(20, 'Alias must be 20 characters or less')
    .optional()
    .or(z.literal('')),
  expiryDate: z.string().optional().or(z.literal('')),
});

export function EditLinkModal({ isOpen, onClose, link }) {
  const updateLinkMutation = useUpdateLink();
  const [serverError, setServerError] = useState('');
  const [isEnabled, setIsEnabled] = useState(true);
  const [isPublicStats, setIsPublicStats] = useState(true);
  const [prevLinkId, setPrevLinkId] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(editLinkSchema),
  });

  if (link && link._id !== prevLinkId) {
    setPrevLinkId(link._id);
    setIsEnabled(link.isEnabled ?? true);
    setIsPublicStats(link.isPublicStats ?? true);
  }

  useEffect(() => {
    if (link) {
      reset({
        originalUrl: link.originalUrl || '',
        customAlias: link.customAlias || '',
        expiryDate: link.expiryDate ? dayjs(link.expiryDate).format('YYYY-MM-DD') : '',
      });
    }
  }, [link, reset]);

  const onSubmit = async (data) => {
    setServerError('');
    try {
      const payload = {
        originalUrl: data.originalUrl,
        customAlias: data.customAlias || '',
        expiryDate: data.expiryDate || '',
        isEnabled,
        isPublicStats,
      };

      await updateLinkMutation.mutateAsync({ id: link._id, data: payload });
      onClose();
    } catch (error) {
      setServerError(error.response?.data?.message || 'Failed to update link. Alias might be taken.');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && link && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-lg"
          >
            <Card className="glass relative">
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Link2 className="w-5 h-5 text-primary" />
                  Edit Short Link Details
                </CardTitle>
                <CardDescription>
                  Modify the destination URL, alias, expiry date, and settings.
                </CardDescription>
              </CardHeader>

              <form onSubmit={handleSubmit(onSubmit)}>
                <CardContent className="space-y-4">
                  {serverError && (
                    <div className="p-3 text-sm text-red-600 bg-red-500/10 border border-red-500/20 rounded-md">
                      {serverError}
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Destination URL *</label>
                    <Input 
                      placeholder="https://very-long-url.com/..." 
                      error={errors.originalUrl?.message}
                      {...register('originalUrl')} 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-1">
                        <Tag className="w-3 h-3" /> Custom Alias
                      </label>
                      <Input 
                        placeholder="my-link" 
                        error={errors.customAlias?.message}
                        {...register('customAlias')} 
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Expiry Date
                      </label>
                      <Input 
                        type="date" 
                        error={errors.expiryDate?.message}
                        {...register('expiryDate')} 
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-sm font-medium flex items-center gap-2">
                          Link Status
                        </label>
                        <p className="text-xs text-muted-foreground">
                          {isEnabled ? "Link is Active and will redirect visitors" : "Link is Disabled and redirect is paused"}
                        </p>
                      </div>
                      <Button 
                        type="button" 
                        variant={isEnabled ? "default" : "outline"} 
                        size="sm"
                        onClick={() => setIsEnabled(!isEnabled)}
                      >
                        {isEnabled ? "Enabled" : "Disabled"}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="space-y-0.5">
                        <label className="text-sm font-medium flex items-center gap-2">
                          {isPublicStats ? <Eye className="w-4 h-4 text-primary" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                          Public Statistics
                        </label>
                        <p className="text-xs text-muted-foreground">
                          {isPublicStats ? "Anyone can view charts and click trends at /stats/:shortCode" : "Only you can view the analytics dashboard"}
                        </p>
                      </div>
                      <Button 
                        type="button" 
                        variant={isPublicStats ? "secondary" : "outline"} 
                        size="sm"
                        onClick={() => setIsPublicStats(!isPublicStats)}
                      >
                        {isPublicStats ? "Public" : "Private"}
                      </Button>
                    </div>
                  </div>
                </CardContent>

                <div className="p-6 pt-0 flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateLinkMutation.isPending}>
                    {updateLinkMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Save Changes
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

import { AlertTriangle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

interface ConfigErrorProps {
  message: string;
  onRetry?: () => void;
}

export default function ConfigError({ message, onRetry }: ConfigErrorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-xl border border-danger/20 bg-danger-bg p-6 text-center"
    >
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-danger/10 border border-danger/20 mb-4">
        <AlertTriangle className="h-7 w-7 text-danger" />
      </div>
      <h3 className="text-base font-semibold text-text-primary mb-2">Configuration Error</h3>
      <p className="text-sm text-text-secondary max-w-md mx-auto mb-4 leading-relaxed">
        {message}
      </p>
      <div className="text-xs text-text-muted bg-bg-elevated rounded-lg p-3 max-w-sm mx-auto text-left font-mono mb-4">
        <p className="mb-1">Required environment variables:</p>
        <p className="text-danger">NEXT_PUBLIC_SUPABASE_URL</p>
        <p className="text-danger">SUPABASE_SERVICE_ROLE_KEY</p>
        <p className="text-warn">HERE_API_KEY</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-all"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
      )}
    </motion.div>
  );
}

import { useRef, useState } from 'react';
import BarcodeDisplay from '@/components/barcode/BarcodeDisplay';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { useBarcode } from '@/hooks/useBarcode';

const InfoIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="8" strokeWidth="3" strokeLinecap="round" />
    <line x1="12" y1="12" x2="12" y2="16" />
  </svg>
);

const BarcodePage = () => {
  const auth = useAuth();
  const settings = useSettings();
  const [isHighlighted, setIsHighlighted] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { barcodeId, isLoading, error, timeUntilRefresh, refresh } = useBarcode(
    auth.isAuthenticated,
    settings.autoRefresh,
    auth.silentReAuth
  );

  const handleBarcodeClick = () => setIsHighlighted((v) => !v);

  const handleInfoClick = () => {
    if (showTooltip) {
      if (tooltipTimeout.current) clearTimeout(tooltipTimeout.current);
      setShowTooltip(false);
    } else {
      setShowTooltip(true);
      tooltipTimeout.current = setTimeout(() => setShowTooltip(false), 3_000);
    }
  };

  return (
    <div className="flex-1 bg-neutral-gray100 flex flex-col overflow-y-auto h-full">
      <div className="flex-1 flex flex-col items-center justify-center px-lg py-lg gap-lg">
        <div className="w-full max-w-sm relative">
          <Card
            className={[
              'transition-all duration-200',
              isHighlighted
                ? 'border-2 border-primary-gold shadow-gold-glow'
                : 'border-2 border-transparent',
            ].join(' ')}
          >
            <BarcodeDisplay
              value={barcodeId ?? ''}
              isLoading={isLoading}
              isHighlighted={isHighlighted}
              onClick={handleBarcodeClick}
            />

            {settings.autoRefresh && !error && (
              <p className="text-xs text-neutral-gray500 text-center mt-sm">
                Refreshing in {timeUntilRefresh}s
              </p>
            )}

            {error && (
              <p className="text-sm text-semantic-error text-center mt-sm" role="alert">
                {error}
              </p>
            )}
          </Card>

          <button
            onClick={handleInfoClick}
            className="absolute top-3 right-3 text-primary-blue hover:opacity-70 transition-opacity"
            aria-label="Info"
            type="button"
          >
            <InfoIcon />
          </button>

          {showTooltip && (
            <div className="absolute top-12 right-3 bg-neutral-gray800 text-white text-xs rounded-md px-md py-sm max-w-[200px] z-10 shadow-lg">
              Tap the barcode to toggle brightness highlight
              <div
                className="absolute -top-1.5 right-3 w-0 h-0"
                style={{
                  borderLeft: '6px solid transparent',
                  borderRight: '6px solid transparent',
                  borderBottom: '6px solid #424242',
                }}
              />
            </div>
          )}
        </div>

        {auth.isDemoMode && (
          <div className="bg-primary-gold/20 border border-primary-gold rounded-lg px-md py-sm">
            <p className="text-primary-gold text-xs font-semibold text-center">Demo Mode</p>
          </div>
        )}

        <div className="w-full max-w-sm">
          <Button
            title="Refresh Now"
            variant="outline"
            onClick={refresh}
            isLoading={isLoading && !barcodeId}
          />
        </div>

        <div className="w-full max-w-sm">
          <Button
            title="Sign Out"
            variant="outline"
            onClick={() => auth.logout()}
            className="border-neutral-gray200 text-neutral-gray600"
          />
        </div>
      </div>
    </div>
  );
};

export default BarcodePage;

import BarcodeDisplay from '@/components/barcode/BarcodeDisplay';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { useBarcode } from '@/hooks/useBarcode';

const BarcodePage = () => {
  const auth = useAuth();
  const settings = useSettings();

  const { barcodeId, isLoading, error, timeUntilRefresh, refresh } = useBarcode(
    auth.isAuthenticated,
    settings.autoRefresh,
    auth.silentReAuth
  );

  return (
    <div className="flex-1 bg-neutral-gray100 flex flex-col overflow-y-auto h-full">
      <div className="flex-1 flex flex-col items-center justify-center px-lg py-lg gap-lg">
        <div className="w-full max-w-sm">
          <Card>
            <BarcodeDisplay value={barcodeId ?? ''} isLoading={isLoading} />

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

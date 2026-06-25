import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import Switch from '@/components/ui/Switch';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

const SettingsPage = () => {
  const auth = useAuth();
  const settings = useSettings();

  return (
    <div className="flex-1 bg-neutral-gray100 overflow-y-auto h-full flex flex-col items-center justify-center">
      <div className="w-full max-w-sm px-lg py-lg flex flex-col gap-lg">
        <Card>
          <h2 className="text-xs font-semibold text-neutral-gray500 uppercase tracking-widest mb-md">
            Account
          </h2>
          <div className="flex items-center justify-between py-sm">
            <div>
              <p className="text-sm font-medium text-neutral-gray800">Signed in as</p>
              <p className="text-base text-primary-blue font-semibold">
                {auth.isDemoMode ? 'Demo User' : (auth.username ?? '—')}
              </p>
            </div>
            {auth.isDemoMode && (
              <span className="text-xs bg-primary-gold/20 text-primary-gold border border-primary-gold rounded-full px-sm py-xs font-semibold">
                Demo
              </span>
            )}
          </div>
        </Card>

        <Card>
          <h2 className="text-xs font-semibold text-neutral-gray500 uppercase tracking-widest mb-md">
            Preferences
          </h2>
          <div className="flex flex-col gap-md">
            <Switch
              label="Auto-refresh barcode"
              value={settings.autoRefresh}
              onValueChange={settings.setAutoRefresh}
            />
            <p className="text-xs text-neutral-gray500 -mt-sm">
              Automatically refreshes your barcode every 12 seconds
            </p>
          </div>
        </Card>

        <Button
          title="Sign Out"
          variant="outline"
          onClick={() => auth.logout()}
          className="border-semantic-error text-semantic-error"
        />

        <p className="text-center text-xs text-neutral-gray500">
          SRCGo Web — UCR Recreation Center
        </p>
      </div>
    </div>
  );
};

export default SettingsPage;

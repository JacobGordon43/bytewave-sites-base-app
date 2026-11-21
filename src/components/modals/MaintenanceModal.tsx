import { uiClasses, iconLabel } from "../../utils/presentation";
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../redux/store';
import { clearBusinessError, updateBusinessInfo } from '../../redux/businessSlice';
import usePlatformStatusUpdate from '../../hooks/usePlatformStatusUpdate';
import { setStatusError } from '../../redux/statusSlice';
import adminService from '../../services/adminService';
import FeedbackMessage from '../FeedbackMessage';
interface MaintenanceModeModalProps {
    open: boolean;
    onClose: () => void;
}
type PendingType = 'site' | 'infrastructure' | null;
export default function MaintenanceModeModal({ open, onClose }: MaintenanceModeModalProps) {
    const [siteActive, setSiteActive] = useState(false);
    const [infraActive, setInfraActive] = useState(false);
    const [pending, setPending] = useState<PendingType>(null);
    const statusSlice = useSelector((state: RootState) => state.status);
    const businessSlice = useSelector((state: RootState) => state.businessInfo);
    const dispatch = useDispatch<AppDispatch>();
    const updateStatus = usePlatformStatusUpdate();
    useEffect(() => {
        setInfraActive(statusSlice.status === "infrastructure-maintenance");
    }, [statusSlice.status]);
    const handleToggle = (type: 'site' | 'infrastructure') => {
        const isActive = type === 'site' ? siteActive : infraActive;
        if (isActive) {
            if (type === 'site') {
                let newBusinessInfo = structuredClone(businessSlice.info!);
                newBusinessInfo.siteMaintenance = false;
                adminService.updateBusinessInfo(businessSlice.info!, newBusinessInfo);
                if (!businessSlice.error) {
                    setSiteActive(false);
                }
            }
            else {
                updateStatus.updateStatus("operational");
                setInfraActive(false);
            }
        }
        else {
            setPending(type);
        }
    };
    const confirmEnable = async () => {
        if (pending === 'site') {
            let newBusinessInfo = structuredClone(businessSlice.info!);
            newBusinessInfo!.siteMaintenance = true;
            dispatch(updateBusinessInfo({ newBusinessInfo, originalBusinessInfo: businessSlice.info! }));
            if (!businessSlice.error) {
                setSiteActive(true);
            }
        }
        else if (pending === 'infrastructure') {
            const updated = await updateStatus.updateStatus("infrastructure-maintenance");
            if (!updateStatus.error && updated) {
                setInfraActive(true);
            }
        }
        setPending(null);
    };
    const cancelPending = () => setPending(null);
    if (!open) {
        return null;
    }
    return (<div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="w-full max-w-md">
         {statusSlice.error && (<FeedbackMessage type="error" message={statusSlice.error} onClose={() => dispatch(setStatusError(null))}/>)}
          {businessSlice.error && (<FeedbackMessage type="error" message={businessSlice.error} onClose={() => dispatch(clearBusinessError())}/>)}
        <div className="flex items-center justify-between">
         
          <div className="flex items-center">
            <div className="w-9 h-9 flex items-center justify-center">
              <span aria-hidden="true">{iconLabel("ri-tools-line text-yellow-400 text-lg")}</span>
            </div>
            <h2>Maintenance Mode</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center">
            <span aria-hidden="true">{iconLabel("ri-close-line text-lg")}</span>
          </button>
        </div>

        <div>
          <p>
            Enabling maintenance mode will redirect visitors to a maintenance page. Toggle off at any time to restore access.
          </p>

          
          <div className={uiClasses(`rounded-xl border p-4 transition-colors ${infraActive ? 'border-slate-700 bg-slate-700/20 opacity-50' : siteActive ? 'border-yellow-500/50 bg-yellow-500/5' : 'border-slate-600 bg-slate-700/40'}`)}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-9 h-9 flex items-center justify-center">
                  <span aria-hidden="true">{iconLabel(`ri-global-line text-xl ${siteActive && !infraActive ? 'text-yellow-400' : 'text-slate-400'}`)}</span>
                </div>
                <div>
                  <p>Site Maintenance</p>
                  <p>{infraActive ? 'Disabled during infrastructure maintenance' : 'this website only'}</p>
                </div>
              </div>
              <button onClick={() => !infraActive && handleToggle('site')} className={uiClasses(`relative inline-flex shrink-0 h-6 w-11 items-center rounded-full transition-colors ${infraActive ? 'cursor-not-allowed bg-slate-600' : `cursor-pointer ${siteActive ? 'bg-yellow-500' : 'bg-slate-600'}`}`)}>
                <span className={uiClasses(`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${siteActive && !infraActive ? 'translate-x-6' : 'translate-x-1'}`)}/>
              </button>
            </div>
            {siteActive && (<p className="flex items-center">
                <span aria-hidden="true">{iconLabel("ri-error-warning-line")}</span>
                <span>Your website is currently in maintenance mode</span>
              </p>)}
            {pending === 'site' && (<div>
                <p className="flex items-center gap-1.5">
                  <span aria-hidden="true">{iconLabel("ri-alert-line")}</span>
                  Confirm Site Maintenance
                </p>
                <p>
                  This will redirect all visitors on this website to the maintenance page. Are you sure?
                </p>
                <div className="flex items-center gap-2">
                  <button className="flex-1" onClick={confirmEnable}>
                    Yes, Enable
                  </button>
                  <button className="flex-1" onClick={cancelPending}>
                    Cancel
                  </button>
                </div>
              </div>)}
          </div>

          
          <div className={uiClasses(`rounded-xl border p-4 transition-colors ${infraActive ? 'border-red-500/50 bg-red-500/5' : 'border-slate-600 bg-slate-700/40'}`)}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-9 h-9 flex items-center justify-center">
                  <span aria-hidden="true">{iconLabel(`ri-apps-line text-xl ${infraActive ? 'text-red-400' : 'text-slate-400'}`)}</span>
                </div>
                <div>
                  <p>Infrastructure Maintenance</p>
                  <p>Affects all managed sites — disables dashboard</p>
                </div>
              </div>
              <button onClick={() => handleToggle('infrastructure')} className={uiClasses(`relative inline-flex shrink-0 h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${infraActive ? 'bg-red-500' : 'bg-slate-600'}`)}>
                <span className={uiClasses(`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${infraActive ? 'translate-x-6' : 'translate-x-1'}`)}/>
              </button>
            </div>
            {infraActive && (<p className="flex items-center">
                <span aria-hidden="true">{iconLabel("ri-error-warning-line")}</span>
                <span>Infrastructure maintenance is active — all dashboard routes are restricted</span>
              </p>)}
            {pending === 'infrastructure' && (<div>
                <p className="flex items-center gap-1.5">
                  <span aria-hidden="true">{iconLabel("ri-alert-line")}</span>
                  Confirm Infrastructure Maintenance
                </p>
                <p>
                  This will take ALL websites offline and restrict all dashboard sub-pages. This is a significant action — are you absolutely sure?
                </p>
                <div className="flex items-center gap-2">
                  <button className="flex-1" onClick={confirmEnable}>
                    Yes, Enable
                  </button>
                  <button className="flex-1" onClick={cancelPending}>
                    Cancel
                  </button>
                </div>
              </div>)}
          </div>
        </div>

        <div className="flex justify-end">
          <button onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>);
}

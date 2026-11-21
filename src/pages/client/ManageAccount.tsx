'use client';
import { uiClasses, iconLabel } from "../../utils/presentation";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AccountSkeleton } from '../../components/SkeletonLoader';
import DashboardLayout from '../../components/DashboardLayout';
import { selectClientById } from '../../redux/selectors/clientsSelector';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '../../auth/AuthContext';
import type { AppDispatch, RootState } from '../../redux/store';
import DomainChangeModal from '../../components/modals/DomainChangeModal';
import ReportIssueModal from '../../components/modals/ReportIssueModal';
import { clearClientError, fetchClientById, updateClient } from '../../redux/clientSlice';
import type { ClientData } from '../../types/daoTypes';
import FeedbackMessage from '../../components/FeedbackMessage';
import SubscriptionsPanel from '../../components/SubscriptionsPanel';
import PasswordInput from '../../components/PasswordInput';
import { updatePassword } from 'aws-amplify/auth';
export default function Account() {
    const navigate = useNavigate();
    const auth = useAuth();
    const dispatch = useDispatch<AppDispatch>();
    const clientSlice = useSelector((state: RootState) => state.clients);
    const client = useSelector((state: RootState) => selectClientById(state, auth?.sub || ""));
    useEffect(() => {
        if (clientSlice.fetchStatus === "idle") {
            dispatch(fetchClientById(auth?.sub || ""));
        }
    }, [auth?.sub, clientSlice.fetchStatus, dispatch]);
    const [profileData, setProfileData] = useState<Partial<ClientData>>({
        clientFirstName: client?.clientFirstName || '',
        clientLastName: client?.clientLastName || '',
        email: client?.email || '',
        phone: client?.phone || '',
        businessName: client?.businessName || '',
        businessEmail: client?.businessEmail || '',
        websiteUrl: client?.websiteUrl || '',
    });
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [passwordSuccess, setPasswordSuccess] = useState(false);
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [activeTab, setActiveTab] = useState('profile');
    const [showReportModal, setShowReportModal] = useState(false);
    const [showDomainModal, setShowDomainModal] = useState(false);
    useEffect(() => {
        if (!client || isEditing)
            return;
        setProfileData({
            clientFirstName: client.clientFirstName || '',
            clientLastName: client.clientLastName || '',
            email: client.email || '',
            phone: client.phone || '',
            businessName: client.businessName || '',
            businessEmail: client.businessEmail || '',
            websiteUrl: client.websiteUrl || '',
        });
    }, [client, isEditing]);
    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setProfileData(prev => ({
            ...prev,
            [name]: value
        }));
    };
    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPasswordError(null);
        setPasswordSuccess(false);
        setPasswordData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };
    const handlePasswordUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setPasswordError(null);
        setPasswordSuccess(false);
        const { currentPassword, newPassword, confirmPassword } = passwordData;
        if (!currentPassword || !newPassword || !confirmPassword) {
            setPasswordError('Please complete all password fields.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordError('The new passwords do not match.');
            return;
        }
        if (currentPassword === newPassword) {
            setPasswordError('Your new password must be different from your current password.');
            return;
        }
        setIsUpdatingPassword(true);
        try {
            await updatePassword({
                oldPassword: currentPassword,
                newPassword,
            });
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
            });
            setPasswordSuccess(true);
        }
        catch (err) {
            if (err instanceof Error && err.name === 'NotAuthorizedException') {
                setPasswordError('Your current password is incorrect.');
            }
            else if (err instanceof Error) {
                setPasswordError(err.message);
            }
            else {
                setPasswordError('Your password could not be updated. Please try again.');
            }
        }
        finally {
            setIsUpdatingPassword(false);
        }
    };
    const handleSaveProfile = async () => {
        if (!client)
            return;
        const newClient = { ...client, ...profileData };
        await dispatch(updateClient({ originalClient: client, newClient })).unwrap();
        setIsEditing(false);
    };
    const tabs = [
        { id: 'profile', name: 'Profile', icon: 'ri-user-line' },
        { id: 'loginInfo', name: 'Login Information', icon: 'ri-shield-user-line' },
        { id: 'account-actions', name: 'Account Actions', icon: 'ri-settings-line' }
    ];
    if (clientSlice.loadingFetch) {
        return (<DashboardLayout currentPage="manage-account" linkType="client">
        <AccountSkeleton />
      </DashboardLayout>);
    }
    return (<DashboardLayout currentPage="manage-account" linkType="client">
      <div>
        
        <div>
          <div className="flex items-center">
            <div className="w-16 h-16 flex items-center justify-center">
              <span>
                {profileData?.clientFirstName?.charAt(0)}{profileData?.clientLastName?.charAt(0)}
              </span>
            </div>
            <div>
              <h1>{profileData.clientFirstName} {profileData.clientLastName}</h1>
              <p>{profileData.email}</p>
              <p>{profileData.businessName}</p>
            </div>
          </div>
        </div>

        
        <div>
          <div>
            <nav className="flex">
              {tabs.map((tab) => (<button key={tab.id} onClick={() => setActiveTab(tab.id)} className={uiClasses(`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
            ? 'border-blue-500 text-blue-400'
            : 'border-transparent text-slate-400 hover:text-slate-300'}`)}>
                  <span aria-hidden="true">{iconLabel(`${tab.icon} mr-2`)}</span>
                  {tab.name}
                </button>))}
            </nav>
          </div>

          <div>
            
            {activeTab === 'profile' && (<div>
                <div className="flex justify-between items-center">
                  <h3>Profile Information</h3>
                  <button onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}>
                    {isEditing ? (clientSlice.loadingUpload ? 'Saving...' : 'Save Changes') : 'Edit Profile'}
                  </button>
                </div>
        
          {clientSlice.error && (<FeedbackMessage type="error" message={clientSlice.error} onClose={() => dispatch(clearClientError())}/>)}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block">
                      First Name
                    </label>
                    <input className="w-full disabled:opacity-50" type="text" name="clientFirstName" value={profileData.clientFirstName} onChange={(e) => handleProfileChange(e)} disabled={!isEditing}/>
                  </div>

                  <div>
                    <label className="block">
                      Last Name
                    </label>
                    <input className="w-full disabled:opacity-50" type="text" name="clientLastName" value={profileData.clientLastName} onChange={handleProfileChange} disabled={!isEditing}/>
                  </div>

                  <div>
                    <label className="block">
                      Personal Email Address
                    </label>
                    <input className="w-full disabled:opacity-50" type="email" name="email" value={profileData.email} onChange={handleProfileChange} disabled={!isEditing}/>
                  </div>

                  <div>
                    <label className="block">
                      Phone Number
                    </label>
                    <input className="w-full disabled:opacity-50" type="tel" name="phone" value={profileData.phone} onChange={handleProfileChange} disabled={!isEditing}/>
                  </div>
                </div>

                <div>
                  <div>
                    <h4>Business Information</h4>
                    <p>
                      Manage the contact details associated with your business.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <label className="block">
                        Business Name
                      </label>
                      <input className="w-full disabled:opacity-50" type="text" name="businessName" value={profileData.businessName} onChange={handleProfileChange} disabled={!isEditing}/>
                    </div>

                    <div>
                      <label className="block">
                        Business Email Address
                      </label>
                      <input className="w-full disabled:opacity-50" type="email" name="businessEmail" value={profileData.businessEmail || ''} onChange={handleProfileChange} disabled={!isEditing}/>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block">
                        Website URL
                      </label>
                      <input className="w-full disabled:opacity-50" type="url" inputMode="url" name="websiteUrl" value={profileData.websiteUrl || ''} disabled aria-describedby="website-url-support-note" placeholder="https://example.com"/>
                      <p id="website-url-support-note">
                        To request a domain change or report an issue with the displayed domain, please reach out to Support through the Account Actions tab.
                      </p>
                    </div>
                  </div>
                </div>
              </div>)}

            
            {activeTab === 'loginInfo' && (<div>
                <h3>Login Information</h3>

                
                <div>
                  <h4>Change Password</h4>
                  {passwordError && (<FeedbackMessage type="error" message={passwordError} onClose={() => setPasswordError(null)}/>)}
                  {passwordSuccess && (<FeedbackMessage type="success" message="Your password was updated successfully." onClose={() => setPasswordSuccess(false)}/>)}
                  <form onSubmit={handlePasswordUpdate}>
                    <div>
                      <label className="block">
                        Current Password
                      </label>
                      <PasswordInput className="w-full" name="currentPassword" value={passwordData.currentPassword} onChange={handlePasswordChange} autoComplete="current-password" visibilityLabel="current password" required disabled={isUpdatingPassword}/>
                    </div>

                    <div>
                      <label className="block">
                        New Password
                      </label>
                      <PasswordInput className="w-full" name="newPassword" value={passwordData.newPassword} onChange={handlePasswordChange} autoComplete="new-password" visibilityLabel="new password" required disabled={isUpdatingPassword}/>
                    </div>

                    <div>
                      <label className="block">
                        Confirm New Password
                      </label>
                      <PasswordInput className="w-full" name="confirmPassword" value={passwordData.confirmPassword} onChange={handlePasswordChange} autoComplete="new-password" visibilityLabel="password confirmation" required disabled={isUpdatingPassword}/>
                    </div>

                    <button type="submit" disabled={isUpdatingPassword}>
                      {isUpdatingPassword ? 'Updating Password...' : 'Update Password'}
                    </button>
                  </form>
                </div>
              </div>)}

            
            {activeTab === 'account-actions' && (<div>
                <h3>Account Actions</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  <div className="md:col-span-2">
                    <SubscriptionsPanel clientId={auth.sub}/>
                  </div>

                  
                  <div>
                    <div className="flex items-start">
                      <div className="w-12 h-12 flex items-center justify-center">
                        <span aria-hidden="true">{iconLabel("ri-global-line text-blue-400 text-xl")}</span>
                      </div>
                      <div className="flex-1">
                        <h4>Change Domain</h4>
                        <p>Request to change your domain name</p>
                        <button onClick={() => setShowDomainModal(true)}>
                          Request Domain Change
                        </button>
                      </div>
                    </div>
                  </div>

                  
                  <div>
                    <div className="flex items-start">
                      <div className="w-12 h-12 flex items-center justify-center">
                        <span aria-hidden="true">{iconLabel("ri-error-warning-line text-orange-400 text-xl")}</span>
                      </div>
                      <div className="flex-1">
                        <h4>Report an Issue</h4>
                        <p>Report a technical or service issue</p>
                        <button onClick={() => setShowReportModal(true)}>
                          Report Issue
                        </button>
                      </div>
                    </div>
                  </div>

                  
                  <div>
                    <div className="flex items-start">
                      <div className="w-12 h-12 flex items-center justify-center">
                        <span aria-hidden="true">{iconLabel("ri-customer-service-2-line text-green-400 text-xl")}</span>
                      </div>
                      <div className="flex-1">
                        <h4>Create Support Ticket</h4>
                        <p>Get help from our support team</p>
                        <button onClick={() => navigate('/support/tickets')}>
                          Go to Support
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>)}
          </div>
        </div>
      </div>

      
      <DomainChangeModal open={showDomainModal} onClose={() => setShowDomainModal(false)}/>

      
      <ReportIssueModal open={showReportModal} onClose={() => setShowReportModal(false)}/>
    </DashboardLayout>);
}

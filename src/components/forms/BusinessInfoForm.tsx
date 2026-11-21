'use client';
import { uiClasses, uiStyle, iconLabel } from "../../utils/presentation";
import { useBusinessInfo } from "../../hooks/useBusinessInfo";
import { useState, useEffect } from 'react';
import type { BusinessInfoData, EmailEntryData, HoursEntryData, SocialMedia, Status } from '../../types/daoTypes';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../../redux/store';
import { clearBusinessError, updateBusinessInfo } from '../../redux/businessSlice';
import FeedbackMessage from '../FeedbackMessage';
const EMPTY_SOCIAL_MEDIA: SocialMedia = {
    facebook: "",
    instagram: "",
    twitter: "",
    tiktok: "",
};
const EMPTY_BUSINESS_INFO: BusinessInfoData = {
    id: "",
    businessHours: [],
    emails: [],
    address: "",
    phoneNumber: "",
    websiteUrl: "",
    siteMaintenance: false,
    addressPrecursor: "none",
    socialMedia: EMPTY_SOCIAL_MEDIA,
};
const SOCIAL_MEDIA_FIELDS: Array<{
    key: keyof SocialMedia;
    label: string;
    icon: string;
    placeholder: string;
}> = [
    {
        key: "facebook",
        label: "Facebook",
        icon: "ri-facebook-fill",
        placeholder: "https://facebook.com/your-page",
    },
    {
        key: "instagram",
        label: "Instagram",
        icon: "ri-instagram-line",
        placeholder: "https://instagram.com/your-profile",
    },
    {
        key: "twitter",
        label: "Twitter / X",
        icon: "ri-twitter-x-line",
        placeholder: "https://x.com/your-profile",
    },
    {
        key: "tiktok",
        label: "TikTok",
        icon: "ri-tiktok-line",
        placeholder: "https://tiktok.com/@your-profile",
    },
];
export default function BusinessInfoForm({ status }: {
    status: Status;
}) {
    const dispatch = useDispatch<AppDispatch>();
    const infraDisabled = status === "infrastructure-maintenance" ? true : false;
    const { slice: businessSlice, error: fetchError, retry } = useBusinessInfo();
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [success, setSuccess] = useState(false);
    const [draft, setDraft] = useState<BusinessInfoData>(EMPTY_BUSINESS_INFO);
    useEffect(() => {
        if (businessSlice.info) {
            setDraft({
                ...EMPTY_BUSINESS_INFO,
                ...structuredClone(businessSlice.info),
                emails: businessSlice.info.emails ?? [],
                businessHours: businessSlice.info.businessHours ?? [],
                socialMedia: {
                    ...EMPTY_SOCIAL_MEDIA,
                    ...businessSlice.info.socialMedia,
                },
            });
        }
    }, [businessSlice.info]);
    const handleNotSaved = () => {
        setHasUnsavedChanges(true);
        setSuccess(false);
    };
    const handleSave = async () => {
        await dispatch(updateBusinessInfo({ newBusinessInfo: draft, originalBusinessInfo: businessSlice.info! })).unwrap();
        if (businessSlice.error) {
            setSuccess(false);
            handleNotSaved();
            return;
        }
        setSuccess(true);
        setHasUnsavedChanges(false);
    };
    const addEmail = () => {
        handleNotSaved();
        setDraft(prev => {
            if (!prev)
                return prev;
            return {
                ...prev,
                emails: [
                    ...prev.emails,
                    {
                        address: "",
                        label: "",
                        isContactForm: draft.emails.length === 0 ? true : false
                    }
                ]
            };
        });
    };
    const removeEmail = (index: number) => {
        handleNotSaved();
        setDraft(prev => {
            if (!prev)
                return prev;
            const remaining = prev.emails.filter((_, i) => i !== index);
            const hadContact = prev.emails[index]?.isContactForm;
            if (hadContact && remaining.length > 0) {
                remaining[0].isContactForm = true;
            }
            return {
                ...prev,
                emails: remaining
            };
        });
    };
    const updateEmail = (index: number, field: keyof EmailEntryData, value: string | boolean) => {
        handleNotSaved();
        setDraft(prev => {
            if (!prev)
                return prev;
            return {
                ...prev,
                emails: prev.emails?.map((e, i) => i === index ? { ...e, [field]: value } : e)
            };
        });
    };
    const addHours = () => {
        handleNotSaved();
        setDraft(prev => {
            if (!prev)
                return prev;
            return {
                ...prev,
                businessHours: [
                    ...prev.businessHours,
                    {
                        closed: false,
                        day: "",
                        closeTime: "",
                        openTime: ""
                    }
                ]
            };
        });
    };
    const removeHours = (index: number) => {
        handleNotSaved();
        setDraft(prev => {
            if (!prev)
                return prev;
            return {
                ...prev,
                businessHours: prev.businessHours.filter((_, i) => index !== i)
            };
        });
    };
    const handleDiscard = () => {
        setDraft(businessSlice.info!);
        setHasUnsavedChanges(false);
        setSuccess(false);
        dispatch(clearBusinessError());
    };
    const updateHours = (index: number, field: keyof HoursEntryData, value: string | boolean) => {
        handleNotSaved();
        setDraft(prev => {
            if (!prev)
                return prev;
            return {
                ...prev,
                businessHours: prev.businessHours?.map((h, i) => index === i ? { ...h, [field]: value } : h)
            };
        });
    };
    const updateSocialMedia = (platform: keyof SocialMedia, value: string) => {
        handleNotSaved();
        setDraft((previousDraft) => ({
            ...previousDraft,
            socialMedia: {
                ...previousDraft.socialMedia,
                [platform]: value,
            },
        }));
    };
    const setContactEmail = (index: number) => {
        setDraft(prev => {
            if (!prev)
                return prev;
            if (prev.emails[index].isContactForm)
                return prev;
            return {
                ...prev,
                emails: prev.emails?.map((e, i) => i === index ? { ...e, isContactForm: true } : { ...e, isContactForm: false })
            };
        });
        handleNotSaved();
    };
    return (<div className={uiClasses(`bg-slate-800 rounded-xl p-6 border transition-opacity ${infraDisabled ? 'border-red-500/30 opacity-60 pointer-events-none select-none' : 'border-slate-700'}`)}>
      {infraDisabled && (<div className="flex items-center gap-2">
          <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
            <span aria-hidden="true">{iconLabel("ri-lock-line text-red-400")}</span>
          </div>
          <p>
            Business information editing is disabled during infrastructure maintenance.
          </p>
        </div>)}

        {hasUnsavedChanges && !infraDisabled && (<div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
              <span aria-hidden="true">{iconLabel("ri-edit-line text-yellow-400 text-sm")}</span>
            </div>
            <p>You have unsaved changes</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleDiscard}>
              Discard
            </button>
            
          </div>
        </div>)}
                
          {businessSlice.error && (<FeedbackMessage type="error" retry={fetchError && businessSlice.error === fetchError ? retry : undefined} message={businessSlice.error} onClose={() => dispatch(clearBusinessError())}/>)}
      <div className="flex items-center justify-between">
        <div>
          <h3>Business Information</h3>
          <p>Manage your contact details, emails, and hours</p>
        </div>
        <button onClick={handleSave} disabled={infraDisabled} className={uiClasses(`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${success
        ? 'bg-green-600 text-white'
        : 'bg-blue-600 hover:bg-blue-700 text-white'}`)}>
          <div className="w-4 h-4 flex items-center justify-center">
            <span aria-hidden="true">{iconLabel(success ? 'ri-check-line' : 'ri-save-line')}</span>
          </div>
          {success ? 'Saved!' : 'Save Changes'}
        </button>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>

          
          <div>
            <label className="block">
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 flex items-center justify-center"><span aria-hidden="true">{iconLabel("ri-phone-line text-blue-400")}</span></span>
                Phone Number
              </span>
            </label>
            <input className="w-full" type="text" value={draft.phoneNumber} onChange={e => setDraft(prev => {
            if (!prev)
                return prev;
            handleNotSaved();
            return {
                ...prev,
                phoneNumber: e.target.value
            };
        })} placeholder="(555) 000-0000"/>
          </div>

          
          <div>
            <label className="block">
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 flex items-center justify-center"><span aria-hidden="true">{iconLabel("ri-map-pin-line text-blue-400")}</span></span>
                Business Address
              </span>
            </label>
                        <div className="flex items-center gap-1.5">
              <button onClick={() => {
            setDraft(prev => ({ ...prev, addressPrecursor: 'none' }));
            setHasUnsavedChanges(true);
        }} className={uiClasses(`text-xs px-3 py-1.5 rounded-md border transition-colors cursor-pointer whitespace-nowrap ${draft.addressPrecursor === 'none'
        ? 'bg-blue-600/30 border-blue-500/60 text-blue-300'
        : 'bg-slate-700 border-slate-600 text-slate-400 hover:border-slate-500'}`)}>
                No Precursor
              </button>
              <button onClick={() => {
            setDraft(prev => ({ ...prev, addressPrecursor: 'based-in' }));
            setHasUnsavedChanges(true);
        }} className={uiClasses(`text-xs px-3 py-1.5 rounded-md border transition-colors cursor-pointer whitespace-nowrap ${draft.addressPrecursor === 'based-in'
        ? 'bg-blue-600/30 border-blue-500/60 text-blue-300'
        : 'bg-slate-700 border-slate-600 text-slate-400 hover:border-slate-500'}`)}>
                Based In
              </button>
              <button onClick={() => {
            setDraft(prev => ({ ...prev, addressPrecursor: 'located-at' }));
            setHasUnsavedChanges(true);
        }} className={uiClasses(`text-xs px-3 py-1.5 rounded-md border transition-colors cursor-pointer whitespace-nowrap ${draft.addressPrecursor === 'located-at'
        ? 'bg-blue-600/30 border-blue-500/60 text-blue-300'
        : 'bg-slate-700 border-slate-600 text-slate-400 hover:border-slate-500'}`)}>
                Located At
              </button>
            </div>
            <textarea className="w-full" value={draft.address} onChange={e => setDraft(prev => {
            if (!prev)
                return prev;
            handleNotSaved();
            return {
                ...prev,
                address: e.target.value
            };
        })} placeholder="Street, Suite, City, State ZIP" rows={2}/>
          </div>

          
          <div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2">
                <span className="w-4 h-4 flex items-center justify-center"><span aria-hidden="true">{iconLabel("ri-mail-line text-blue-400")}</span></span>
                Email Addresses
              </label>
              <button onClick={addEmail} className="flex items-center gap-1.5">
                <span className="w-4 h-4 flex items-center justify-center"><span aria-hidden="true">{iconLabel("ri-add-line")}</span></span>
                Add Email
              </button>
            </div>

            <div>
              {draft.emails?.map((email, index) => (<div key={index} className="flex flex-col sm:flex-row sm:items-center gap-2" style={uiStyle({ background: 'rgba(30,41,59,0.6)' })}>
                  <input className="w-full sm:flex-1 min-w-0" type="email" value={email.address} onChange={e => updateEmail(index, 'address', e.target.value)} placeholder="email@example.com"/>
                  <input className="w-full sm:w-28 flex-shrink-0" type="text" value={email.label} onChange={e => updateEmail(index, 'label', e.target.value)} placeholder="Label"/>
                  <div className="flex items-center justify-between sm:justify-start gap-2">
                    <button onClick={() => setContactEmail(index)} className={uiClasses(`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full transition-all cursor-pointer whitespace-nowrap ${email.isContactForm
            ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/50'
            : 'bg-slate-700 text-slate-400 border border-slate-600 hover:border-slate-500'}`)}>
                      <span className="w-3 h-3 flex items-center justify-center">
                        <span aria-hidden="true">{iconLabel(email.isContactForm ? 'ri-checkbox-circle-fill' : 'ri-checkbox-blank-circle-line')}</span>
                      </span>
                      Contact Form
                    </button>
                    {draft.emails.length > 1 && (<button onClick={() => removeEmail(index)} className="w-7 h-7 flex items-center justify-center flex-shrink-0">
                        <span className="w-6 h-6 flex items-center justify-center">
                          <span aria-hidden="true">{iconLabel("ri-close-line text-xl")}</span>
                        </span>
                      </button>)}
                  </div>
                </div>))}
            </div>
          </div>
        </div>

        
        <div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2">
              <span className="w-4 h-4 flex items-center justify-center"><span aria-hidden="true">{iconLabel("ri-time-line text-blue-400")}</span></span>
              Business Hours
            </label>
            <button onClick={addHours} className="flex items-center gap-1.5">
              <span className="w-4 h-4 flex items-center justify-center"><span aria-hidden="true">{iconLabel("ri-add-line")}</span></span>
              Add Entry
            </button>
          </div>

          <div>
            {draft.businessHours?.map((entry, index) => (<div key={index} className={uiClasses(`rounded-lg px-3 py-2.5 border transition-colors ${entry.closed
            ? 'bg-slate-700/30 border-slate-700/50'
            : 'border-slate-600/50 bg-slate-700/20'}`)}>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  
                  <input className="w-full sm:flex-1 min-w-0" type="text" value={entry.day} onChange={e => updateHours(index, 'day', e.target.value)} placeholder="Day / Label"/>

                  
                  <div className="flex items-center gap-1.5 w-full sm:w-auto">
                    <input className="flex-1 sm:w-28 disabled:opacity-30 min-w-0" type="time" value={entry.openTime} disabled={entry.closed} onChange={e => updateHours(index, 'openTime', e.target.value)}/>
                    <span className="flex-shrink-0">—</span>
                    <input className="flex-1 sm:w-28 disabled:opacity-30 min-w-0" type="time" value={entry.closeTime} disabled={entry.closed} onChange={e => updateHours(index, 'closeTime', e.target.value)}/>
                  </div>

                  
                  <div className="flex items-center gap-2 w-full sm:w-auto sm:flex-shrink-0">
                    
                    <button onClick={() => updateHours(index, 'closed', !entry.closed)} className={uiClasses(`sm:hidden flex-1 text-xs px-2.5 py-1.5 rounded-md border transition-colors cursor-pointer ${entry.closed
            ? 'bg-red-500/20 border-red-500/50 text-red-400'
            : 'bg-slate-700 border-slate-600 text-slate-400 hover:border-red-500/40 hover:text-red-400'}`)}>
                      Closed
                    </button>

                    
                    <button onClick={() => updateHours(index, 'closed', !entry.closed)} className={uiClasses(`hidden sm:flex w-8 h-8 items-center justify-center rounded-md border transition-colors cursor-pointer ${entry.closed
            ? 'bg-red-500/20 border-red-500/50 text-red-400'
            : 'bg-slate-700 border-slate-600 text-slate-500 hover:border-red-500/40 hover:text-red-400'}`)} title={entry.closed ? 'Closed' : 'Mark as closed'}>
                      <span className="w-4 h-4 flex items-center justify-center">
                        <span aria-hidden="true">{iconLabel("ri-forbid-line text-sm")}</span>
                      </span>
                    </button>

                    
                    <button onClick={() => removeHours(index)} className="w-8 h-8 flex items-center justify-center">
                      <span className="w-6 h-6 flex items-center justify-center">
                        <span aria-hidden="true">{iconLabel("ri-close-line text-xl")}</span>
                      </span>
                    </button>
                  </div>
                </div>
              </div>))}
          </div>

          <p>
            Toggle the red icon to mark a day as closed.
          </p>
        </div>
      </div>

      <div>
        <div>
          <h4 className="flex items-center gap-2">
            <span aria-hidden="true">{iconLabel("ri-share-line text-blue-400")}</span>
            Social Media
          </h4>
          <p>
            Leave a field empty to hide that social platform from the website footer.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {SOCIAL_MEDIA_FIELDS.map((field) => (<div key={field.key}>
              <label className="flex items-center gap-2">
                <span aria-hidden="true">{iconLabel(`${field.icon} text-blue-400`)}</span>
                {field.label}
              </label>
              <input className="w-full" type="url" inputMode="url" value={draft.socialMedia?.[field.key] ?? ""} onChange={(event) => updateSocialMedia(field.key, event.target.value)} placeholder={field.placeholder} autoComplete="url"/>
            </div>))}
        </div>
      </div>
    </div>);
}

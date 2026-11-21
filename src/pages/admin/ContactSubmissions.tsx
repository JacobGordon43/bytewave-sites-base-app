import { siteConfig } from "../../config/site";
import { uiClasses, iconLabel } from "../../utils/presentation";
import { useContactSubmissions } from "../../hooks/useContactSubmissions";
import FeedbackMessage from "../../components/FeedbackMessage";
import { getContactSubmissionDisplay } from "../../utils/contactSubmissionDisplay";
import { useState, useMemo } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { ContactSubmissionsSkeleton } from '../../components/SkeletonLoader';
import SEO from '../../components/SEO';
import type { Submission } from '../../types/daoTypes';
import type { AppDispatch } from '../../redux/store';
import { useDispatch } from 'react-redux';
import { deleteContactSubmission, clearContactError } from '../../redux/contactSlice';
const formatProjectType = (val: string) => {
    const map: Record<string, string> = {
        'website-development': 'Website Development',
        'website-design': 'Website Design',
        'hosting': 'Web Hosting',
        'aws-solution': 'AWS Solution',
        'full-package': 'Complete Package'
    };
    return Object.hasOwn(map, val) ? map[val] : val;
};
const formatSubject = (val: string) => {
    const map: Record<string, string> = {
        'web-development': 'Web Development',
        'web-design': 'Web Design',
        'hosting': 'Web Hosting',
        'aws-solution': 'AWS Solution',
        'support': 'Technical Support',
        'other': 'Other'
    };
    return Object.hasOwn(map, val) ? map[val] : val;
};
export default function ContactSubmissionsPage() {
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'all' | 'consultation' | 'contact'>('all');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const { slice: contactSlice, items: storedSubmissions, error: fetchError, retry, isLoading } = useContactSubmissions();
    const submissions = useMemo(() => storedSubmissions.map(original => ({
        ...getContactSubmissionDisplay(original), original,
    })), [storedSubmissions]);
    const dispatch = useDispatch<AppDispatch>();
    const handleDelete = async (submission: Submission) => {
        try {
            await dispatch(deleteContactSubmission(submission)).unwrap();
            setDeletingId(null);
        }
        catch {
        }
    };
    const filtered = submissions.filter(s => activeTab === 'all' || s.type === activeTab);
    const totalConsultations = submissions.filter(s => s.type === 'consultation').length;
    const totalContacts = submissions.filter(s => s.type === 'contact').length;
    if (isLoading) {
        return (<DashboardLayout currentPage="contact-submissions" linkType='admin'>
            <SEO title={"Bytewave Sites | Contact Submissions".replaceAll("Bytewave Sites", siteConfig.name)}/>
        <ContactSubmissionsSkeleton />
      </DashboardLayout>);
    }
    return (<DashboardLayout currentPage="contact-submissions" linkType="admin">
        <SEO title={"Bytewave Sites | Manage Account".replaceAll("Bytewave Sites", siteConfig.name)}/>
      <div>
        {contactSlice.error && <FeedbackMessage type="error" message={contactSlice.error} onClose={() => dispatch(clearContactError())} retry={fetchError && contactSlice.error === fetchError ? retry : undefined}/>}
        <div>
          <h1>Contact Submissions</h1>
          <p>View and manage form submissions from your website</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center">
            <div className="w-11 h-11 flex items-center justify-center">
              <span aria-hidden="true">{iconLabel("ri-mail-line text-blue-400 text-lg")}</span>
            </div>
            <div>
              <p>Total Submissions</p>
              <p>{submissions.length}</p>
            </div>
          </div>
          <div className="flex items-center">
            <div className="w-11 h-11 flex items-center justify-center">
              <span aria-hidden="true">{iconLabel("ri-discuss-line text-purple-400 text-lg")}</span>
            </div>
            <div>
              <p>Consultations</p>
              <p>{totalConsultations}</p>
            </div>
          </div>
          <div className="flex items-center">
            <div className="w-11 h-11 flex items-center justify-center">
              <span aria-hidden="true">{iconLabel("ri-chat-3-line text-cyan-400 text-lg")}</span>
            </div>
            <div>
              <p>Contact Messages</p>
              <p>{totalContacts}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center w-fit">
          {(['all', 'consultation', 'contact'] as const).map(tab => (<button key={tab} onClick={() => setActiveTab(tab)} className={uiClasses(`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap cursor-pointer capitalize ${activeTab === tab
            ? 'bg-blue-600 text-white'
            : 'text-slate-400 hover:text-white hover:bg-slate-700'}`)}>
              {tab === 'all' ? 'All' : tab === 'consultation' ? 'Consultations' : 'Contact Messages'}
            </button>))}
        </div>

        {filtered.length === 0 ? (<div>
            <span aria-hidden="true">{iconLabel("ri-inbox-line text-4xl text-slate-600 mb-4 block")}</span>
            <h3>No submissions yet</h3>
            <p>Submissions from your website forms will appear here.</p>
          </div>) : (<div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {filtered.map((submission, index) => {
                const isDeleting = Boolean(submission.id) && deletingId === submission.id;
                const isExpanded = Boolean(submission.id) && expandedId === submission.id;
                const isConsultation = submission.type === 'consultation';
                return (<div key={submission.id || `missing-id-${index}`} className="relative overflow-hidden flex flex-col">
                  {isDeleting && (<div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4">
                      <div className="w-14 h-14 flex items-center justify-center">
                        <span aria-hidden="true">{iconLabel("ri-delete-bin-line text-red-400 text-2xl")}</span>
                      </div>
                      <div>
                        <p>Delete Submission?</p>
                        <p>
                          <span>{submission.id || "Missing ID"}</span> â€” {submission.name}
                        </p>
                        <p>This action cannot be undone.</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button onClick={() => setDeletingId(null)}>
                          Cancel
                        </button>
                        <button onClick={() => handleDelete(submission.original)} disabled={contactSlice.loadingDelete} className={uiClasses(`text-white px-5 py-2 rounded-lg transition-colors text-sm font-medium whitespace-nowrap ${contactSlice.loadingDelete ? 'bg-red-900/60 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 cursor-pointer'}`)}>
                          {contactSlice.loadingDelete ? 'Deleting' : 'Delete'}
                        </button>
                      </div>
                    </div>)}

                  <div className="flex-1 flex flex-col">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center">
                        <span>{submission.id || "Missing ID"}</span>
                        <span className={uiClasses(`px-2 py-0.5 rounded text-xs font-medium ${isConsultation
                    ? 'bg-purple-600/20 text-purple-300 border border-purple-700'
                    : 'bg-cyan-600/20 text-cyan-300 border border-cyan-700'}`)}>
                          {submission.typeLabel}
                        </span>
                      </div>
                      <span suppressHydrationWarning={true}>
                        {submission.dateLabel}
                      </span>
                    </div>

                    <div className="flex items-center">
                      <div className="w-9 h-9 flex items-center justify-center">
                        <span>{submission.initial}</span>
                      </div>
                      <div>
                        <p>{submission.name}</p>
                        <p>{submission.email}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {submission.phone && (<div className="flex items-center">
                          <span aria-hidden="true">{iconLabel("ri-phone-line text-slate-500")}</span>
                          <span>{submission.phone}</span>
                        </div>)}
                      {submission.company && (<div className="flex items-center">
                          <span aria-hidden="true">{iconLabel("ri-building-line text-slate-500")}</span>
                          <span>{submission.company}</span>
                        </div>)}
                      {isConsultation && (<>
                          <div className="flex items-center">
                            <span aria-hidden="true">{iconLabel("ri-code-box-line text-slate-500")}</span>
                            <span>{formatProjectType(submission.projectType)}</span>
                          </div>
                        </>)}
                      {!isConsultation && submission.subject && (<div className="flex items-center col-span-2">
                          <span aria-hidden="true">{iconLabel("ri-price-tag-3-line text-slate-500")}</span>
                          <span>Subject: {formatSubject(submission.subject)}</span>
                        </div>)}
                    </div>

                    <div>
                      <p className={uiClasses(`text-slate-300 text-sm leading-relaxed ${!isExpanded ? 'line-clamp-3' : ''}`)}>
                        {submission.content}
                      </p>
                      {submission.canExpand && Boolean(submission.id) && (<button onClick={() => setExpandedId(isExpanded ? null : submission.id)}>
                          {isExpanded ? 'Show less' : 'Read more'}
                        </button>)}
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <a href={submission.replyHref} aria-disabled={!submission.replyHref} className="flex items-center">
                      <span aria-hidden="true">{iconLabel("ri-reply-line")}</span>
                      <span>Reply</span>
                    </a>
                    <button onClick={() => setDeletingId(submission.id)} disabled={!submission.id} className="flex items-center">
                      <span aria-hidden="true">{iconLabel("ri-delete-bin-line")}</span>
                      <span>Delete</span>
                    </button>
                  </div>
                </div>);
            })}
          </div>)}
      </div>
    </DashboardLayout>);
}

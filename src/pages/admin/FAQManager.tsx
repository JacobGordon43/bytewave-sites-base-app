import { siteConfig } from "../../config/site";
import { uiClasses, iconLabel } from "../../utils/presentation";
import { useFAQ } from "../../hooks/useFAQ";
import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import FAQEditor from "./FAQEditor";
import type { FAQSectionData } from "../../types/daoTypes";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../../redux/store";
import { clearFAQError, saveFAQ } from "../../redux/faqSlice";
import { FAQManagerSkeleton } from "../../components/SkeletonLoader";
import SEO from "../../components/SEO";
import FeedbackMessage from "../../components/FeedbackMessage";
export default function FAQManager() {
    const dispatch = useDispatch<AppDispatch>();
    const { items: savedSections, slice: faqSlice, error: fetchError, retry, isLoading } = useFAQ();
    const [sections, setSections] = useState<FAQSectionData[]>([]);
    const [editingSection, setEditingSection] = useState<FAQSectionData | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    useEffect(() => {
        if (faqSlice.fetchStatus === "succeeded") {
            setSections(structuredClone(savedSections));
        }
    }, [savedSections, faqSlice.fetchStatus]);
    const handleSaveSection = (section: FAQSectionData) => {
        if (isCreating) {
            setSections([...sections, section]);
        }
        else {
            setSections(sections.map(s => s.id === section.id ? section : s));
        }
        setEditingSection(null);
        setIsCreating(false);
        setHasUnsavedChanges(true);
        setSaveSuccess(false);
    };
    const handleDeleteSection = (id: string) => {
        setSections(sections.filter(s => s.id !== id));
        setDeleteConfirm(null);
        setSaveSuccess(false);
        setHasUnsavedChanges(true);
    };
    const handleCreateNew = () => {
        setIsCreating(true);
        setEditingSection(null);
    };
    const handleEditSection = (section: FAQSectionData) => {
        setIsCreating(false);
        setEditingSection(section);
    };
    const handleCancel = () => {
        setEditingSection(null);
        setIsCreating(false);
    };
    const handleMoveSection = (sectionId: string, direction: 'up' | 'down') => {
        const index = sections.findIndex(s => s.id === sectionId);
        if ((direction === 'up' && index === 0) ||
            (direction === 'down' && index === sections.length - 1))
            return;
        const newSections = [...sections];
        const swapIndex = direction === 'up' ? index - 1 : index + 1;
        [newSections[index], newSections[swapIndex]] = [newSections[swapIndex], newSections[index]];
        setSections(newSections);
        setHasUnsavedChanges(true);
        setSaveSuccess(false);
    };
    const handleSaveAll = async () => {
        await dispatch(saveFAQ(sections)).unwrap();
        if (!faqSlice.error) {
            setHasUnsavedChanges(false);
            setSaveSuccess(true);
        }
    };
    if (isLoading) {
        return (<DashboardLayout currentPage="about-manager" linkType="admin">
          <SEO title={"Bytewave Sites | FAQ Manager".replaceAll("Bytewave Sites", siteConfig.name)}/>
          <FAQManagerSkeleton />
        </DashboardLayout>);
    }
    if (editingSection || isCreating) {
        return (<DashboardLayout currentPage="manage-faq" linkType="admin">
        <SEO title={"Bytewave Sites | FAQ Manager".replaceAll("Bytewave Sites", siteConfig.name)}/>

        <FAQEditor section={editingSection} totalSections={sections.length} onSave={handleSaveSection} onCancel={handleCancel}/>
      </DashboardLayout>);
    }
    return (<DashboardLayout currentPage="manage-faq" linkType="admin">
      <SEO title={"Bytewave Sites | FAQ Manager".replaceAll("Bytewave Sites", siteConfig.name)}/>
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1>FAQ Management</h1>
            <p>Add, edit, and manage your FAQ sections and questions</p>
          </div>
          <button onClick={handleCreateNew} className="flex items-center gap-2">
            <span aria-hidden="true">{iconLabel("ri-add-line")}</span>
            Add Section
          </button>
        </div>

        <div>
          {sections.map((section, index) => (<div className="overflow-hidden relative group" key={section.id}>
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 z-10">
                {index > 0 && (<button onClick={() => handleMoveSection(section.id, 'up')} className="w-8 h-8 flex items-center justify-center">
                    <span aria-hidden="true">{iconLabel("ri-arrow-up-line")}</span>
                  </button>)}
                {index < sections.length - 1 && (<button onClick={() => handleMoveSection(section.id, 'down')} className="w-8 h-8 flex items-center justify-center">
                    <span aria-hidden="true">{iconLabel("ri-arrow-down-line")}</span>
                  </button>)}
                <button onClick={() => handleEditSection(section)} className="w-8 h-8 flex items-center justify-center">
                  <span aria-hidden="true">{iconLabel("ri-edit-line")}</span>
                </button>
                <button onClick={() => setDeleteConfirm(section.id)} className="w-8 h-8 flex items-center justify-center">
                  <span aria-hidden="true">{iconLabel("ri-delete-bin-line")}</span>
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 flex items-center justify-center">
                    <span aria-hidden="true">{iconLabel("ri-question-answer-line text-white text-xl")}</span>
                  </div>
                  <div>
                    <h3>{section.title}</h3>
                    <p>{section.faqs.length} question{section.faqs.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto">
                {section.faqs.map((faq, faqIndex) => (<div key={faq.id}>
                    <div className="flex items-start gap-3">
                      <span>Q{faqIndex + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p>{faq.question}</p>
                        <p>{faq.answer}</p>
                      </div>
                    </div>
                  </div>))}
              </div>

              {deleteConfirm === section.id && (<div className="absolute inset-0 flex items-center justify-center z-10">
                  <div>
                    <span aria-hidden="true">{iconLabel("ri-error-warning-line text-4xl text-red-400 mb-3")}</span>
                    <p>Delete this section?</p>
                    <p>All {section.faqs.length} questions will be deleted.</p>
                    <div className="flex gap-3 justify-center">
                      <button onClick={() => setDeleteConfirm(null)}>
                        Cancel
                      </button>
                      <button onClick={() => handleDeleteSection(section.id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>)}
            </div>))}
        </div>

        {sections.length === 0 && (<div>
            <span aria-hidden="true">{iconLabel("ri-question-answer-line text-5xl text-slate-600 mb-4")}</span>
            <h3>No FAQ Sections Yet</h3>
            <p>Get started by adding your first FAQ section.</p>
            <button onClick={handleCreateNew} className="inline-flex items-center gap-2">
              <span aria-hidden="true">{iconLabel("ri-add-line")}</span>
              Add Your First Section
            </button>
          </div>)}
          
          {faqSlice.error && (<FeedbackMessage type="error" retry={fetchError && faqSlice.error === fetchError ? retry : undefined} message={faqSlice.error} onClose={() => dispatch(clearFAQError())}/>)}
        {sections.length > 0 && (<div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {(hasUnsavedChanges && !faqSlice.loadingUpload) && (<span className="flex items-center gap-1">
                  <span aria-hidden="true">{iconLabel("ri-error-warning-line")}</span>
                  You have unsaved changes
                </span>)}
              {faqSlice.loadingUpload && (<span className="flex items-center gap-1">
                  <span aria-hidden="true">{iconLabel("ri-error-warning-line")}</span>
                  Saving changes...
                </span>)}
              {saveSuccess && (<FeedbackMessage type="success" message="Changes saved successfully." onClose={() => setSaveSuccess(false)}/>)}
            </div>
            <button onClick={handleSaveAll} disabled={!hasUnsavedChanges || faqSlice.loadingFetch} className={uiClasses(`px-6 py-3 rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap ${hasUnsavedChanges && !faqSlice.loadingUpload ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer' : 'bg-slate-700 text-slate-400 cursor-not-allowed'}`)}>
              <span aria-hidden="true">{iconLabel("ri-save-line")}</span>
              Save Changes
            </button>
          </div>)}
      </div>
    </DashboardLayout>);
}

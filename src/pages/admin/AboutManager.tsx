import { siteConfig } from "../../config/site";
import { uiClasses, iconLabel } from "../../utils/presentation";
import { useAbout } from "../../hooks/useAbout";
import { useEffect, useState } from "react";
import type { AboutSectionData } from "../../types/daoTypes";
import DashboardLayout from "../../components/DashboardLayout";
import AboutEditor from "./AboutEditor";
import { useDispatch } from "react-redux";
import { type AppDispatch } from "../../redux/store";
import { clearAboutError, saveAbout } from "../../redux/aboutSlice";
import { AboutManagerSkeleton } from "../../components/SkeletonLoader";
import SEO from "../../components/SEO";
import FeedbackMessage from "../../components/FeedbackMessage";
export default function AboutManager() {
    const dispatch = useDispatch<AppDispatch>();
    const { items: savedSections, slice: aboutSlice, error: fetchError, retry, isLoading } = useAbout();
    const [sections, setSections] = useState<AboutSectionData[]>([]);
    const [editingSection, setEditingSection] = useState<AboutSectionData | null>(null);
    const [isCreating, setIsCreating] = useState<boolean>(false);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    useEffect(() => {
        if (aboutSlice.fetchStatus === "succeeded")
            setSections(structuredClone(savedSections));
    }, [savedSections, aboutSlice.fetchStatus]);
    const handleSaveSection = (section: AboutSectionData) => {
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
        setHasUnsavedChanges(true);
        setSaveSuccess(false);
    };
    const handleSaveAll = async () => {
        await dispatch(saveAbout(sections)).unwrap();
        if (!aboutSlice.error) {
            setSaveSuccess(true);
            setHasUnsavedChanges(false);
        }
    };
    const handleCreateNew = () => {
        setIsCreating(true);
        setEditingSection(null);
        setHasUnsavedChanges(true);
        setSaveSuccess(false);
    };
    const handleEditSection = (section: AboutSectionData) => {
        setIsCreating(false);
        setEditingSection(section);
    };
    const handleCancel = () => {
        setEditingSection(null);
        setIsCreating(false);
    };
    const handleMoveSection = (index: number, direction: 'up' | 'down') => {
        const newSections = [...sections];
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= sections.length)
            return;
        [newSections[index], newSections[newIndex]] = [newSections[newIndex], newSections[index]];
        setHasUnsavedChanges(true);
        setSaveSuccess(false);
        setSections(newSections);
    };
    const getGridCols = (cols: number) => {
        switch (cols) {
            case 1: return 'grid-cols-1';
            case 2: return 'grid-cols-1 md:grid-cols-2';
            case 3: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
            default: return 'grid-cols-1';
        }
    };
    if (isLoading) {
        return (<DashboardLayout currentPage="about-manager" linkType="admin">
        <SEO title={"Bytewave Sites | About Manager".replaceAll("Bytewave Sites", siteConfig.name)}/>    
        <AboutManagerSkeleton />
      </DashboardLayout>);
    }
    if (editingSection || isCreating) {
        return (<DashboardLayout currentPage="manage-about" linkType="admin">
              <SEO title={"Bytewave Sites | About Editor".replaceAll("Bytewave Sites", siteConfig.name)}/>    
              <AboutEditor section={editingSection} onSave={handleSaveSection} onCancel={handleCancel} totalSections={sections.length}/>
          </DashboardLayout>);
    }
    return (<DashboardLayout linkType="admin" currentPage="manage-about">
      <SEO title={"Bytewave Sites | About Manager".replaceAll("Bytewave Sites", siteConfig.name)}/>    
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1>About Page Management</h1>
            <p>Add, edit, and manage your About page sections</p>
          </div>
          <button onClick={handleCreateNew} className="flex items-center gap-2">
            <span aria-hidden="true">{iconLabel("ri-add-line")}</span>
            Add Section
          </button>
        </div>
          
          {aboutSlice.error && (<FeedbackMessage type="error" retry={fetchError && aboutSlice.error === fetchError ? retry : undefined} message={aboutSlice.error} onClose={() => dispatch(clearAboutError())}/>)}
        <div>
          {sections.map((section, index) => (<div className="overflow-hidden relative group" key={section.id}>
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 z-10">
                {index > 0 && (<button onClick={() => handleMoveSection(index, 'up')} className="w-8 h-8 flex items-center justify-center">
                    <span aria-hidden="true">{iconLabel("ri-arrow-up-line")}</span>
                  </button>)}
                {index < sections.length - 1 && (<button onClick={() => handleMoveSection(index, 'down')} className="w-8 h-8 flex items-center justify-center">
                    <span aria-hidden="true">{iconLabel("ri-arrow-down-line")}</span>
                  </button>)}
                <button onClick={() => handleEditSection(section)} className="w-8 h-8 flex items-center justify-center">
                  <span aria-hidden="true">{iconLabel("ri-edit-line")}</span>
                </button>
                <button onClick={() => setDeleteConfirm(section.id)} className="w-8 h-8 flex items-center justify-center">
                  <span aria-hidden="true">{iconLabel("ri-delete-bin-line")}</span>
                </button>
              </div>

              <div className={uiClasses(`${section.backgroundColor} p-8`)}>
                <div>
                  <h2>{section.title}</h2>
                  {section.subtitle && (<p>{section.subtitle}</p>)}
                </div>

                <div className={uiClasses(`grid ${getGridCols(section.columns)} gap-6`)}>
                  {section.blocks.map((block) => (<div key={block.id}>
                      {block.type === 'image' ? (<div className="overflow-hidden h-64">
                          {block.imageUrl ? (<img className="w-full h-full" src={block.imageUrl} alt="Content"/>) : (<div className="w-full h-full flex items-center justify-center">
                              <span aria-hidden="true">{iconLabel("ri-image-line text-slate-400 text-3xl")}</span>
                            </div>)}
                        </div>) : section.isCard ? (<div className="h-full">
                          {section.cardType === 'icon' && (<div className={uiClasses(`w-14 h-14 ${block.iconColor || 'bg-blue-600'} rounded-xl flex items-center justify-center mb-6`)}>
                              <span aria-hidden="true">{iconLabel(`${block.icon || 'ri-star-line'} text-white text-2xl`)}</span>
                            </div>)}
                          {section.cardType === 'image' && (<div className="w-full h-64 overflow-hidden">
                              {block.imageUrl ? (<img className="w-full h-full" src={block.imageUrl} alt=""/>) : (<div className="w-full h-full flex items-center justify-center">
                                  <span aria-hidden="true">{iconLabel("ri-image-line text-slate-400 text-2xl")}</span>
                                </div>)}
                            </div>)}
                          <h3>{block.title}</h3>
                          <p>{block.description || 'Block description...'}</p>
                        </div>) : (<div className="h-full">
                          <h3>{block.title}</h3>
                          <p>{block.description || 'Block description...'}</p>
                        </div>)}
                    </div>))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span>{section.columns} column{section.columns > 1 ? 's' : ''}</span>
                  <span>•</span>
                  <span>{section.rows} row{section.rows > 1 ? 's' : ''}</span>
                  <span>•</span>
                  <span>{section.isCard ? `Cards (${section.cardType})` : 'No cards'}</span>
                </div>
              </div>

              {deleteConfirm === section.id && (<div className="absolute inset-0 flex items-center justify-center z-20">
                  <div>
                    <span aria-hidden="true">{iconLabel("ri-error-warning-line text-4xl text-red-400 mb-3")}</span>
                    <p>Delete this section?</p>
                    <p>This action cannot be undone.</p>
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
            <span aria-hidden="true">{iconLabel("ri-file-list-3-line text-5xl text-slate-600 mb-4")}</span>
            <h3>No Sections Yet</h3>
            <p>Get started by adding your first About page section.</p>
            <button onClick={handleCreateNew} className="inline-flex items-center gap-2">
              <span aria-hidden="true">{iconLabel("ri-add-line")}</span>
              Add Your First Section
            </button>
          </div>)}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {(hasUnsavedChanges && !aboutSlice.loadingUpload) && (<span className="flex items-center gap-1">
              <span aria-hidden="true">{iconLabel("ri-error-warning-line")}</span>
              You have unsaved changes
            </span>)}
          {aboutSlice.loadingUpload && (<span className="flex items-center gap-1">
              <span aria-hidden="true">{iconLabel("ri-error-warning-line")}</span>
              Saving changes...
            </span>)}
          {saveSuccess && (<FeedbackMessage type="success" message="Changes saved successfully." onClose={() => setSaveSuccess(false)}/>)}
        </div>
        <button onClick={handleSaveAll} disabled={!hasUnsavedChanges || aboutSlice.loadingUpload} className={uiClasses(`px-6 py-3 rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap ${hasUnsavedChanges && !aboutSlice.loadingUpload ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer' : 'bg-slate-700 text-slate-400 cursor-not-allowed'}`)}>
          <span aria-hidden="true">{iconLabel("ri-save-line")}</span>
          Save Changes
        </button>
      </div>
    </DashboardLayout>);
}

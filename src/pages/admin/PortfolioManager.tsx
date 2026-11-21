import { siteConfig } from "../../config/site";
import { uiClasses, iconLabel } from "../../utils/presentation";
import { usePortfolio } from "../../hooks/usePortfolio";
import { useState } from 'react';
import PortfolioEditor from './PortfolioEditor';
import type { PortfolioData } from '../../types/daoTypes';
import DashboardLayout from '../../components/DashboardLayout';
import { PortfolioManagerSkeleton } from '../../components/SkeletonLoader';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../../redux/store';
import { clearPortfolioError, createPortfolio, deletePortfolio, updatePortfolio } from '../../redux/portfolioSlice';
import SEO from '../../components/SEO';
import FeedbackMessage from '../../components/FeedbackMessage';
export default function PortfolioManager() {
    const { items: savedPortfolio, slice: portfolioSlice, error: fetchError, retry, isLoading } = usePortfolio();
    const [editingProject, setEditingProject] = useState<PortfolioData | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [saveNotice, setSaveNotice] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const dispatch = useDispatch<AppDispatch>();
    const handleSaveProject = async (project: PortfolioData) => {
        try {
            if (isCreating) {
                await dispatch(createPortfolio(project));
                if (portfolioSlice.error) {
                    setSaveNotice(portfolioSlice.error);
                }
                else {
                    setSaveNotice('Project added successfully');
                }
            }
            else {
                await dispatch(updatePortfolio({ originalPortfolio: savedPortfolio.find(p => p.id === project.id)!, newPortfolio: project }));
            }
        }
        catch {
            setSaveNotice(portfolioSlice.error || 'Failed to save project');
        }
        setEditingProject(null);
        setIsCreating(false);
    };
    const handleDeleteProject = async (id: string) => {
        try {
            await dispatch(deletePortfolio(id)).unwrap();
            setSaveNotice('Project deleted successfully');
            setDeleteConfirm(null);
        }
        catch {
            setSaveNotice(portfolioSlice.error || 'Failed to delete project');
        }
    };
    const handleCreateNew = () => {
        setIsCreating(true);
        setEditingProject(null);
    };
    const handleEditProject = (project: PortfolioData) => {
        setIsCreating(false);
        setEditingProject(project);
    };
    const handleCancel = () => {
        setEditingProject(null);
        setIsCreating(false);
    };
    const categories = ['All', ...new Set(savedPortfolio.map(p => p.category))];
    const filteredProjects = filterCategory === 'All'
        ? savedPortfolio
        : savedPortfolio.filter(p => p.category === filterCategory);
    if (isLoading) {
        return (<DashboardLayout currentPage="portfolio" linkType='admin'>
        <SEO title={"Bytewave Sites | Portfolio Manager".replaceAll("Bytewave Sites", siteConfig.name)}/>

        <PortfolioManagerSkeleton />
      </DashboardLayout>);
    }
    if (editingProject || isCreating) {
        return (<DashboardLayout currentPage="portfolio" linkType='admin'>
        <SEO title={"Bytewave Sites | Portfolio Editor".replaceAll("Bytewave Sites", siteConfig.name)}/>
        <PortfolioEditor item={editingProject} categories={[...new Set(savedPortfolio.map(p => p.category))]} onSave={handleSaveProject} onCancel={handleCancel}/>
      </DashboardLayout>);
    }
    return (<DashboardLayout currentPage="portfolio" linkType='admin'>
      <SEO title={"Bytewave Sites | Portfolio Manager".replaceAll("Bytewave Sites", siteConfig.name)}/>
      <div>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1>Portfolio Management</h1>
            <p>Add, edit, and manage your portfolio savedPortfolio</p>
          </div>
          <button onClick={handleCreateNew} className="flex items-center gap-2">
            <span aria-hidden="true">{iconLabel("ri-add-line")}</span>
            Add Project
          </button>
        </div>
          
          {portfolioSlice.error && (<FeedbackMessage type="error" retry={fetchError && portfolioSlice.error === fetchError ? retry : undefined} message={portfolioSlice.error} onClose={() => dispatch(clearPortfolioError())}/>)}
          {saveNotice && !portfolioSlice.error && (<FeedbackMessage type="success" message={saveNotice} onClose={() => setSaveNotice("")}/>)}

        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <span>{filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="relative">
            <button onClick={() => setShowFilterDropdown(!showFilterDropdown)} className="flex items-center gap-2">
              <span aria-hidden="true">{iconLabel("ri-filter-3-line text-slate-400")}</span>
              {filterCategory === 'All' ? 'All Categories' : filterCategory}
              <span aria-hidden="true">{iconLabel(`ri-arrow-${showFilterDropdown ? 'up' : 'down'}-s-line text-slate-400`)}</span>
            </button>
            {showFilterDropdown && (<div className="absolute top-full right-0 z-20 min-w-[180px] max-h-64 overflow-y-auto">
                {categories.map((cat) => (<button key={cat} onClick={() => { setFilterCategory(cat); setShowFilterDropdown(false); }} className={uiClasses(`w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer ${filterCategory === cat ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-600'}`)}>
                    {cat === 'All' ? 'All Categories' : cat}
                  </button>))}
              </div>)}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProjects.map((project) => (<div className="overflow-hidden relative group" key={project.id}>
              <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 z-10">
                <button onClick={() => handleEditProject(project)} className="w-8 h-8 flex items-center justify-center">
                  <span aria-hidden="true">{iconLabel("ri-edit-line text-sm")}</span>
                </button>
                <button onClick={() => setDeleteConfirm(project.id)} className="w-8 h-8 flex items-center justify-center">
                  <span aria-hidden="true">{iconLabel("ri-delete-bin-line text-sm")}</span>
                </button>
              </div>

              <div className="overflow-hidden relative">
                {project.imageUrl ? (<img className="w-full h-full" src={project.imageUrl} alt={project.title}/>) : (<div className="w-full h-full flex items-center justify-center">
                    <span aria-hidden="true">{iconLabel("ri-image-line text-slate-500 text-3xl")}</span>
                  </div>)}
                <div className="absolute top-3 left-3">
                  <span>
                    {project.category}
                  </span>
                </div>
              </div>

              <div>
                <h3>{project.title}</h3>
                <p>{project.description}</p>
                {project.website && (<div className="flex items-center gap-1">
                    <span aria-hidden="true">{iconLabel("ri-link text-xs")}</span>
                    <span>{project.website}</span>
                  </div>)}
              </div>

              {deleteConfirm === project.id && (<div className="absolute inset-0 flex items-center justify-center z-20">
                  <div>
                    <span aria-hidden="true">{iconLabel("ri-error-warning-line text-4xl text-red-400 mb-3")}</span>
                    <p>Delete this project?</p>
                    <p>This will be saved immediately.</p>
                    <div className="flex gap-3 justify-center">
                      <button onClick={() => setDeleteConfirm(null)}>
                        Cancel
                      </button>
                      <button onClick={() => handleDeleteProject(project.id)} disabled={portfolioSlice.loadingDelete} className={uiClasses(`px-4 py-2 text-white rounded-lg transition-colors whitespace-nowrap ${portfolioSlice.loadingDelete ? 'bg-red-900/60 cursor-not-allowed' : 'bg-red-600 hover:bg-red-500 cursor-pointer'}`)}>
                        {portfolioSlice.loadingDelete ? 'Deleting' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </div>)}
            </div>))}
        </div>

        {filteredProjects.length === 0 && savedPortfolio.length > 0 && (<div>
            <span aria-hidden="true">{iconLabel("ri-filter-off-line text-5xl text-slate-600 mb-4")}</span>
            <h3>No Projects in This Category</h3>
            <p>Try selecting a different category filter.</p>
            <button onClick={() => setFilterCategory('All')}>
              Show all savedPortfolio
            </button>
          </div>)}

        {savedPortfolio.length === 0 && (<div>
            <span aria-hidden="true">{iconLabel("ri-gallery-line text-5xl text-slate-600 mb-4")}</span>
            <h3>No Projects Yet</h3>
            <p>Get started by adding your first portfolio project.</p>
            <button onClick={handleCreateNew} className="inline-flex items-center gap-2">
              <span aria-hidden="true">{iconLabel("ri-add-line")}</span>
              Add Your First Project
            </button>
          </div>)}
      </div>
    </DashboardLayout>);
}

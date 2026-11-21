import { siteConfig } from "../../config/site";
import { uiClasses, iconLabel } from "../../utils/presentation";
import { useServices } from "../../hooks/useServices";
import { useEffect, useState } from "react";
import type { ServiceData } from "../../types/daoTypes";
import DashboardLayout from "../../components/DashboardLayout";
import ServiceEditor from "./ServiceEditor";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../../redux/store";
import { clearServiceError, saveServices } from "../../redux/servicesSlice";
import { ServicesManagerSkeleton } from "../../components/SkeletonLoader";
import SEO from "../../components/SEO";
import { textColors } from "../../utils/colorClasses";
import FeedbackMessage from "../../components/FeedbackMessage";
export default function ServicesManager() {
    const [services, setServices] = useState<ServiceData[]>([]);
    const { items: savedServices, slice: servicesSlice, error: fetchError, retry, isLoading } = useServices();
    const [editingService, setEditingService] = useState<ServiceData | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const dispatch = useDispatch<AppDispatch>();
    useEffect(() => {
        if (servicesSlice.fetchStatus === "succeeded") {
            setServices(structuredClone(savedServices));
        }
    }, [savedServices, servicesSlice.fetchStatus]);
    const handleSaveAll = async () => {
        await dispatch(saveServices(services)).unwrap();
        if (!servicesSlice.error) {
            setHasUnsavedChanges(false);
            setSaveSuccess(true);
        }
        else {
            setSaveSuccess(false);
        }
    };
    const handleSaveService = (service: ServiceData) => {
        if (isCreating) {
            setServices([...services, service]);
        }
        else {
            setServices(services.map(s => s.id === service.id ? service : s));
        }
        setHasUnsavedChanges(true);
        setEditingService(null);
        setIsCreating(false);
        setSaveSuccess(false);
    };
    const handleDeleteService = (id: string) => {
        setServices(services.filter(s => s.id !== id));
        setDeleteConfirm(null);
        setHasUnsavedChanges(true);
        setSaveSuccess(false);
    };
    const handleCreateNew = () => {
        setIsCreating(true);
        setEditingService(null);
    };
    const handleEditService = (service: ServiceData) => {
        setIsCreating(false);
        setEditingService(service);
    };
    const handleCancel = () => {
        setEditingService(null);
        setIsCreating(false);
    };
    if (isLoading) {
        return (<DashboardLayout currentPage="about-manager" linkType="admin">
        <SEO title={"Bytewave Sites | Services Manager".replaceAll("Bytewave Sites", siteConfig.name)}/>
        <ServicesManagerSkeleton />
      </DashboardLayout>);
    }
    if (editingService || isCreating) {
        return (<DashboardLayout currentPage="manage-services" linkType="admin">
            <SEO title={"Bytewave Sites | Service Editor".replaceAll("Bytewave Sites", siteConfig.name)}/>
              <ServiceEditor service={editingService} onSave={handleSaveService} onCancel={handleCancel} totalServices={services.length}/>
          </DashboardLayout>);
    }
    return (<DashboardLayout currentPage="services" linkType="admin">
      <SEO title={"Bytewave Sites | Services Manager".replaceAll("Bytewave Sites", siteConfig.name)}/>
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1>Services Management</h1>
            <p>Add, edit, and manage your service offerings</p>
          </div>
          <button onClick={handleCreateNew} className="flex items-center gap-2">
            <span aria-hidden="true">{iconLabel("ri-add-line")}</span>
            Add Service
          </button>
        </div>
          
          {servicesSlice.error && (<FeedbackMessage type="error" retry={fetchError && servicesSlice.error === fetchError ? retry : undefined} message={servicesSlice.error} onClose={() => dispatch(clearServiceError())}/>)}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {services.map((service) => (<div key={service.id} className={uiClasses(`${service.featured ? 'bg-gradient-to-br from-blue-600 to-purple-600' : 'bg-slate-700'} rounded-2xl p-6 border ${service.featured ? 'border-transparent' : 'border-slate-600'} relative group`)}>
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100">
                <button onClick={() => handleEditService(service)} className="w-8 h-8 flex items-center justify-center">
                  <span aria-hidden="true">{iconLabel("ri-edit-line")}</span>
                </button>
                <button onClick={() => setDeleteConfirm(service.id)} className="w-8 h-8 flex items-center justify-center">
                  <span aria-hidden="true">{iconLabel("ri-delete-bin-line")}</span>
                </button>
              </div>

              <div className="flex items-start">
                <div className={uiClasses(`w-14 h-14 rounded-xl flex items-center justify-center mr-4`)}>
                  <span aria-hidden="true">{iconLabel(`${service.icon} ${textColors[service.serviceColor]} text-xl`)}</span>
                </div>
                <div>
                  <h3>{service.title}</h3>
                  <p className={uiClasses(`${service.featured ? 'text-blue-100' : textColors[service.serviceColor]} font-semibold text-sm`)}>
                    {service.subtitle}
                  </p>
                </div>
              </div>
              
              <p className={uiClasses(`${service.featured ? 'text-blue-100' : 'text-slate-300'} text-sm mb-4`)}>
                {service.description}
              </p>
              
              <div>
                <div>
                  <h4>{service.primaryList.title}</h4>
                  <ul className={uiClasses(`space-y-1 ${service.featured ? 'text-blue-100' : 'text-slate-300'} text-sm`)}>
                    {service.primaryList.items.map((item) => (<li key={item.id} className="flex items-start">
                        <span aria-hidden="true">{iconLabel(`ri-check-line ${service.featured ? 'text-green-300' : 'text-green-400'} mr-2 text-xs mt-0.5 flex-shrink-0`)}</span>
                        <span>{item.text}</span>
                      </li>))}
                  </ul>
                </div>

                {service.secondaryLists.map((list) => (<div key={list.id} className={uiClasses(`${service.featured ? 'bg-white/10' : 'bg-slate-600'} p-3 rounded-lg`)}>
                    <h5>{list.title}</h5>
                    <div className={uiClasses(`text-sm ${service.featured ? 'text-blue-100' : 'text-slate-300'} space-y-1`)}>
                      {list.items.map((item) => (<div key={item.id} className="flex items-start">
                          <span className="flex-shrink-0">•</span>
                          <span>{item.text}</span>
                        </div>))}
                    </div>
                  </div>))}
              </div>

              {deleteConfirm === service.id && (<div className="absolute inset-0 flex items-center justify-center">
                  <div>
                    <span aria-hidden="true">{iconLabel("ri-error-warning-line text-4xl text-red-400 mb-3")}</span>
                    <p>Delete this service?</p>
                    <p>This action cannot be undone.</p>
                    <div className="flex gap-3 justify-center">
                      <button onClick={() => setDeleteConfirm(null)}>
                        Cancel
                      </button>
                      <button onClick={() => handleDeleteService(service.id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>)}
            </div>))}
        </div>

        {services.length === 0 && (<div>
            <span aria-hidden="true">{iconLabel("ri-service-line text-5xl text-slate-600 mb-4")}</span>
            <h3>No Services Yet</h3>
            <p>Get started by adding your first service offering.</p>
            <button onClick={handleCreateNew} className="inline-flex items-center gap-2">
              <span aria-hidden="true">{iconLabel("ri-add-line")}</span>
              Add Your First Service
            </button>
          </div>)}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {(hasUnsavedChanges && !servicesSlice.loadingUpload) && (<span className="flex items-center gap-1">
                <span aria-hidden="true">{iconLabel("ri-error-warning-line")}</span>
                You have unsaved changes
              </span>)}
            {servicesSlice.loadingUpload && (<span className="flex items-center gap-1">
                <span aria-hidden="true">{iconLabel("ri-error-warning-line")}</span>
                Saving changes...
              </span>)}
            {saveSuccess && (<FeedbackMessage type="success" message="Changes saved successfully." onClose={() => setSaveSuccess(false)}/>)}
          </div>
          <button onClick={handleSaveAll} disabled={!hasUnsavedChanges || servicesSlice.loadingUpload} className={uiClasses(`px-6 py-3 rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap ${hasUnsavedChanges && !servicesSlice.loadingUpload ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer' : 'bg-slate-700 text-slate-400 cursor-not-allowed'}`)}>
            <span aria-hidden="true">{iconLabel("ri-save-line")}</span>
            Save Changes
          </button>
        </div>
      </div>
    </DashboardLayout>);
}

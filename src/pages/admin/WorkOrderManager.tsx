import { siteConfig } from "../../config/site";
import { uiClasses, uiStyle, iconLabel } from "../../utils/presentation";
import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { WorkOrdersSkeleton } from '../../components/SkeletonLoader';
import WorkOrderModal from '../../components/modals/CreateWorkOrderModal';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../redux/store';
import { clearWorkOrderError, createWorkOrder, deleteWorkOrder, fetchWorkOrders, updateWorkOrder } from '../../redux/workOrderSlice';
import type { TaskData, WorkOrderData } from '../../types/daoTypes';
import { selectWorkOrders } from '../../redux/selectors/workOrderSelector';
import { v4 as uuidv4 } from "uuid";
import SEO from '../../components/SEO';
import FeedbackMessage from '../../components/FeedbackMessage';
import { fetchClients } from '../../redux/clientSlice';
export default function WorkOrderManager() {
    const [showModal, setShowModal] = useState(false);
    const [editingWorkOrder, setEditingWorkOrder] = useState<WorkOrderData | null>(null);
    const workOrders = useSelector(selectWorkOrders);
    const dispatch = useDispatch<AppDispatch>();
    const workOrderSlice = useSelector((state: RootState) => state.workOrders);
    const [newTask, setNewTask] = useState("");
    const [deletingWorkOrder, setDeletingWorkOrder] = useState<string | null>(null);
    const clientsSlice = useSelector((state: RootState) => state.clients);
    useEffect(() => {
        if (workOrderSlice.fetchStatus === "idle") {
            dispatch(fetchWorkOrders());
        }
        if (clientsSlice.fetchStatus === "idle") {
            dispatch(fetchClients());
        }
    }, [dispatch, workOrderSlice.fetchStatus]);
    const handleCreateWorkOrder = async (workOrderData: Omit<WorkOrderData, 'id' | 'createdAt'>) => {
        const newWorkOrder: WorkOrderData = {
            ...workOrderData,
            id: "",
            createdAt: new Date().getTime()
        };
        await dispatch(createWorkOrder(newWorkOrder)).unwrap();
        if (!workOrderSlice.error) {
            return true;
        }
        else {
            return false;
        }
    };
    const handleTaskStatusChange = (taskId: string, newStatus: TaskData['status']) => {
        setEditingWorkOrder(prev => {
            if (!prev)
                return prev;
            return {
                ...prev,
                tasks: prev.tasks.map(task => task.id === taskId ? { ...task, status: newStatus } : task)
            };
        });
    };
    const handleEditWorkOrder = (workOrder: WorkOrderData) => {
        setEditingWorkOrder(structuredClone(workOrder));
        setNewTask("");
    };
    const handleSaveWorkOrder = async (newWorkOrder: WorkOrderData) => {
        setNewTask("");
        const originalWorkOrder = workOrders.find(wo => wo.id === newWorkOrder.id)!;
        await dispatch(updateWorkOrder({ originalWorkOrder, newWorkOrder })).unwrap();
        setEditingWorkOrder(null);
    };
    const handleTaskTitleChange = (taskId: string, newTitle: string) => {
        setEditingWorkOrder(prev => prev ? {
            ...prev,
            tasks: prev.tasks.map(task => task.id === taskId ? { ...task, title: newTitle } : task)
        } : prev);
    };
    const handleDescriptionChange = (newDescription: string) => {
        setEditingWorkOrder(prev => prev ? { ...prev, description: newDescription } : prev);
    };
    const handleUrgencyChange = (newUrgency: WorkOrderData['urgency']) => {
        setEditingWorkOrder(prev => prev ? { ...prev, urgency: newUrgency } : prev);
    };
    const handleExpectedCompletionChange = (dateString: string) => {
        const newDate = new Date(dateString).getTime();
        setEditingWorkOrder(prev => prev ? { ...prev, expectedCompletion: newDate } : prev);
    };
    const handleAddTask = () => {
        const title = newTask.trim();
        if (!title)
            return;
        setEditingWorkOrder(prev => prev ? {
            ...prev,
            tasks: [...prev.tasks, { id: uuidv4(), title, status: "not-started" }]
        } : prev);
        setNewTask("");
    };
    const handleRemoveTask = (taskId: string) => {
        setEditingWorkOrder(prev => prev ? {
            ...prev,
            tasks: prev.tasks.filter(task => task.id !== taskId)
        } : prev);
    };
    const handleDeleteWorkOrder = async (workOrder: WorkOrderData) => {
        try {
            await dispatch(deleteWorkOrder(workOrder)).unwrap();
            setDeletingWorkOrder(null);
        }
        catch {
        }
    };
    const getStatusColor = (status: TaskData['status']) => {
        switch (status) {
            case 'not-started':
                return 'bg-slate-600 text-slate-100';
            case 'in-progress':
                return 'bg-yellow-600 text-yellow-100';
            case 'completed':
                return 'bg-green-600 text-green-100';
        }
    };
    const getStatusIcon = (status: TaskData['status']) => {
        switch (status) {
            case 'not-started':
                return 'ri-time-line';
            case 'in-progress':
                return 'ri-loader-4-line';
            case 'completed':
                return 'ri-check-line';
        }
    };
    const getUrgencyColor = (urgency: WorkOrderData['urgency']) => {
        switch (urgency) {
            case 'low':
                return 'bg-slate-600 text-slate-100';
            case 'medium':
                return 'bg-blue-600 text-blue-100';
            case 'high':
                return 'bg-orange-600 text-orange-100';
            case 'urgent':
                return 'bg-red-600 text-red-100';
        }
    };
    const getUrgencyIcon = (urgency: WorkOrderData['urgency']) => {
        switch (urgency) {
            case 'low':
                return 'ri-arrow-down-line';
            case 'medium':
                return 'ri-subtract-line';
            case 'high':
                return 'ri-arrow-up-line';
            case 'urgent':
                return 'ri-alarm-warning-line';
        }
    };
    const formatDate = (dateNum: number) => {
        const date = new Date(dateNum);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };
    const getProgress = (tasks: TaskData[]) => {
        const completed = tasks.filter(t => t.status === 'completed').length;
        return Math.round((completed / tasks.length) * 100);
    };
    const isOverdue = (expectedCompletion: number) => {
        return new Date(expectedCompletion) < new Date();
    };
    const totalTasks = workOrders.reduce((acc, wo) => acc + wo.tasks.length, 0);
    const completedTasks = workOrders.reduce((acc, wo) => acc + wo.tasks.filter(t => t.status === 'completed').length, 0);
    const inProgressTasks = workOrders.reduce((acc, wo) => acc + wo.tasks.filter(t => t.status === 'in-progress').length, 0);
    const notStartedTasks = workOrders.reduce((acc, wo) => acc + wo.tasks.filter(t => t.status === 'not-started').length, 0);
    if (workOrderSlice.loadingFetch) {
        return (<DashboardLayout currentPage="work-orders" linkType="admin">
        <SEO title={"Bytewave Sites | Work Order Manager".replaceAll("Bytewave Sites", siteConfig.name)}/>
        <WorkOrdersSkeleton />
      </DashboardLayout>);
    }
    return (<DashboardLayout currentPage="work-orders" linkType='admin'>
      <SEO title={"Bytewave Sites | Work Order Manager".replaceAll("Bytewave Sites", siteConfig.name)}/>
      <div>
        <div className="flex justify-between items-center">
          <div>
            <h1>Work Orders</h1>
            <p>Manage and track all work orders and their tasks</p>
          </div>
          <button onClick={() => setShowModal(true)} className="flex items-center">
            <span aria-hidden="true">{iconLabel("ri-add-line")}</span>
            <span>New Work Order</span>
          </button>
        </div>
          
          {workOrderSlice.error && (<FeedbackMessage type="error" message={workOrderSlice.error} onClose={() => dispatch(clearWorkOrderError())}/>)}
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[160px]">
            <div className="flex items-center">
              <div className="w-10 h-10 flex items-center justify-center">
                <span aria-hidden="true">{iconLabel("ri-folder-line text-purple-400")}</span>
              </div>
              <div>
                <p>Work Orders</p>
                <p>{workOrders.length}</p>
              </div>
            </div>
          </div>

          <div className="flex-1 min-w-[160px]">
            <div className="flex items-center">
              <div className="w-10 h-10 flex items-center justify-center">
                <span aria-hidden="true">{iconLabel("ri-file-list-3-line text-blue-400")}</span>
              </div>
              <div>
                <p>Total Tasks</p>
                <p>{totalTasks}</p>
              </div>
            </div>
          </div>

          <div className="flex-1 min-w-[160px]">
            <div className="flex items-center">
              <div className="w-10 h-10 flex items-center justify-center">
                <span aria-hidden="true">{iconLabel("ri-time-line text-slate-400")}</span>
              </div>
              <div>
                <p>Not Started</p>
                <p>{notStartedTasks}</p>
              </div>
            </div>
          </div>

          <div className="flex-1 min-w-[160px]">
            <div className="flex items-center">
              <div className="w-10 h-10 flex items-center justify-center">
                <span aria-hidden="true">{iconLabel("ri-loader-4-line text-yellow-400")}</span>
              </div>
              <div>
                <p>In Progress</p>
                <p>{inProgressTasks}</p>
              </div>
            </div>
          </div>

          <div className="flex-1 min-w-[160px]">
            <div className="flex items-center">
              <div className="w-10 h-10 flex items-center justify-center">
                <span aria-hidden="true">{iconLabel("ri-check-line text-green-400")}</span>
              </div>
              <div>
                <p>Completed</p>
                <p>{completedTasks}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {workOrders.map((workOrder) => {
            const isEditing = editingWorkOrder?.id === workOrder.id;
            const currentWorkOrder = isEditing ? editingWorkOrder : workOrder;
            const isDeleting = deletingWorkOrder === workOrder.id;
            const overdue = isOverdue(currentWorkOrder.expectedCompletion) && getProgress(currentWorkOrder.tasks) < 100;
            return (<div key={workOrder.id} className="relative overflow-hidden flex flex-col">
                {isDeleting && (<div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4">
                    <div className="w-14 h-14 flex items-center justify-center">
                      <span aria-hidden="true">{iconLabel("ri-delete-bin-line text-red-400 text-2xl")}</span>
                    </div>
                    <div>
                      <p>Delete Work Order?</p>
                      <p>
                        <span>{workOrder.id}</span> — {workOrder.clientName}
                      </p>
                      <p>This action cannot be undone.</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setDeletingWorkOrder(null)}>
                        Cancel
                      </button>
                      <button onClick={() => handleDeleteWorkOrder(workOrder)} disabled={workOrderSlice.loadingDelete} className={uiClasses(`text-white px-5 py-2 rounded-lg transition-colors text-sm font-medium whitespace-nowrap ${workOrderSlice.loadingDelete ? 'bg-red-900/60 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 cursor-pointer'}`)}>
                        {workOrderSlice.loadingDelete ? 'Deleting' : 'Delete'}
                      </button>
                    </div>
                  </div>)}

                <div className="flex-1 flex flex-col">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <span>{workOrder.id}</span>
                        {workOrder.ticketId && (<span>from {workOrder.ticketId}</span>)}
                      </div>
                      <h3>{workOrder.clientName}</h3>
                    </div>
                    <div className="flex items-center">
                      {isEditing ? (<div className="relative">
                          <select value={currentWorkOrder.urgency} onChange={(e) => handleUrgencyChange(e.target.value as WorkOrderData['urgency'])}>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                          </select>
                          <span aria-hidden="true">{iconLabel("ri-arrow-down-s-line absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xs")}</span>
                        </div>) : (<span className={uiClasses(`px-2 py-1 rounded text-xs font-medium capitalize flex items-center space-x-1 ${getUrgencyColor(workOrder.urgency)}`)}>
                          <span aria-hidden="true">{iconLabel(`${getUrgencyIcon(workOrder.urgency)} text-xs`)}</span>
                          <span>{workOrder.urgency}</span>
                        </span>)}
                    </div>
                  </div>

                  <div className="flex items-center">
                    <div className="flex items-center">
                      <span aria-hidden="true">{iconLabel("ri-calendar-line")}</span>
                      <span>Created: {formatDate(workOrder.createdAt)}</span>
                    </div>
                    <div className={uiClasses(`flex items-center space-x-1 ${overdue ? 'text-red-400' : 'text-slate-400'}`)}>
                      <span aria-hidden="true">{iconLabel(overdue ? 'ri-alarm-warning-line' : 'ri-calendar-check-line')}</span>
                      {isEditing ? (<input type="date" value={new Date(currentWorkOrder.expectedCompletion)
                        .toISOString()
                        .split("T")[0]} onChange={(e) => handleExpectedCompletionChange(e.target.value)}/>) : (<span>Due: {formatDate(workOrder.expectedCompletion)}{overdue && ' (Overdue)'}</span>)}
                    </div>
                  </div>

                  {isEditing ? (<textarea className="w-full" value={currentWorkOrder.description} onChange={(e) => handleDescriptionChange(e.target.value)} rows={2}/>) : (<p>{workOrder.description}</p>)}

                  <div>
                    {currentWorkOrder.tasks.length === 0 ? (<p>No tasks added yet.</p>) : (<>
                          <div className="flex items-center justify-between">
                            <span>Progress</span>
                            <span>{getProgress(currentWorkOrder.tasks)}%</span>
                          </div>
                          <div className="w-full h-2">
                            <div className="h-2" style={uiStyle({ width: `${getProgress(currentWorkOrder.tasks)}%` })}/>
                          </div>                        
                        </>)}
                  </div>

                  <div className="flex-1 flex flex-col">
                    <p>Tasks ({currentWorkOrder.tasks.length})</p>
                    <div className={uiClasses(`space-y-2 ${currentWorkOrder.tasks.length > 4 ? 'overflow-y-auto max-h-[240px] pr-2' : ''}`)}>
                      {currentWorkOrder.tasks.map((task) => (<div key={task.id} className="flex items-center justify-between">
                          <div className="flex items-center flex-1 min-w-0">
                            <span aria-hidden="true">{iconLabel(`${getStatusIcon(task.status)} text-sm ${task.status === 'completed' ? 'text-green-400' :
                    task.status === 'in-progress' ? 'text-yellow-400' : 'text-slate-400'}`)}</span>
                            {isEditing ? (<input className="flex-1 min-w-0" type="text" value={task.title} onChange={(e) => handleTaskTitleChange(task.id, e.target.value)}/>) : (<span className={uiClasses(`text-sm ${task.status === 'completed' ? 'text-slate-400 line-through' : 'text-white'} truncate`)}>
                                {task.title}
                              </span>)}
                          </div>
                          {isEditing ? (<div className="flex items-center">
                              <div className="relative group">
                                <button className={uiClasses(`px-2 py-1 rounded text-xs font-medium capitalize ${getStatusColor(task.status)} cursor-pointer whitespace-nowrap`)}>
                                  {task.status.replace('-', ' ')}
                                </button>
                                <div className="absolute right-0 bottom-full opacity-0 invisible group-hover:opacity-100 group-hover:visible z-10 min-w-[120px]">
                                  <button onClick={() => handleTaskStatusChange(task.id, 'not-started')} className="w-full flex items-center">
                                    <span aria-hidden="true">{iconLabel("ri-time-line text-slate-400")}</span>
                                    <span>Not Started</span>
                                  </button>
                                  <button onClick={() => handleTaskStatusChange(task.id, 'in-progress')} className="w-full flex items-center">
                                    <span aria-hidden="true">{iconLabel("ri-loader-4-line text-yellow-400")}</span>
                                    <span>In Progress</span>
                                  </button>
                                  <button onClick={() => handleTaskStatusChange(task.id, 'completed')} className="w-full flex items-center">
                                    <span aria-hidden="true">{iconLabel("ri-check-line text-green-400")}</span>
                                    <span>Completed</span>
                                  </button>
                                </div>
                              </div>
                              <button onClick={() => handleRemoveTask(task.id)} className="w-6 h-6 flex items-center justify-center">
                                <span aria-hidden="true">{iconLabel("ri-delete-bin-line text-sm")}</span>
                              </button>
                            </div>) : (<span className={uiClasses(`ml-2 px-2 py-1 rounded text-xs font-medium whitespace-nowrap capitalize ${getStatusColor(task.status)}`)}>
                              {task.status.replace('-', ' ')}
                            </span>)}
                        </div>))}
                    </div>

                    {isEditing && (<div className="flex items-center">
                        <input className="flex-1" type="text" value={newTask || ''} onChange={(e) => setNewTask(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddTask()} placeholder="New task name..."/>
                        <button onClick={() => handleAddTask()} disabled={!(newTask || '').trim()} className="flex items-center">
                          <span aria-hidden="true">{iconLabel("ri-add-line")}</span>
                          <span>Add</span>
                        </button>
                      </div>)}
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    {!isEditing && (<button onClick={() => setDeletingWorkOrder(workOrder.id)} className="flex items-center">
                        <span aria-hidden="true">{iconLabel("ri-delete-bin-line")}</span>
                        <span>Delete</span>
                      </button>)}
                  </div>
                  <div className="flex items-center">
                    {isEditing ? (<>
                        <button onClick={() => {
                        setEditingWorkOrder(null);
                        setNewTask("");
                    }} className="flex items-center">
                          <span aria-hidden="true">{iconLabel("ri-close-line")}</span>
                          <span>Cancel</span>
                        </button>
                        <button onClick={() => handleSaveWorkOrder(currentWorkOrder)} className="flex items-center">
                          <span aria-hidden="true">{iconLabel("ri-save-line")}</span>
                          <span>{workOrderSlice.loadingUpload ? "Save" : "Saving..."}</span>
                        </button>
                      </>) : (<button onClick={() => handleEditWorkOrder(workOrder)} className="flex items-center">
                        <span aria-hidden="true">{iconLabel("ri-edit-line")}</span>
                        <span>Edit</span>
                      </button>)}
                  </div>
                </div>
              </div>);
        })}
        </div>
        

        {workOrders.length === 0 && (<div>
            <span aria-hidden="true">{iconLabel("ri-file-list-3-line text-4xl text-slate-600 mb-4")}</span>
            <h3>No work orders yet</h3>
            <p>Create your first work order to start tracking tasks</p>
            <button onClick={() => setShowModal(true)}>
              Create Work Order
            </button>
          </div>)}
      </div>

      <WorkOrderModal isOpen={showModal} onClose={() => setShowModal(false)} onSave={handleCreateWorkOrder}/>
    </DashboardLayout>);
}

import { uiClasses, iconLabel } from "../../utils/presentation";
import { useState } from 'react';
import type { TaskData, WorkOrderData } from '../../types/daoTypes';
import type { RootState } from '../../redux/store';
import { useSelector } from 'react-redux';
import { selectClients } from '../../redux/selectors/clientsSelector';
interface WorkOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (workOrder: Omit<WorkOrderData, 'id' | 'createdAt'>) => Promise<boolean>;
    clientName?: string;
    ticketId?: string;
}
export default function WorkOrderModal({ isOpen, onClose, onSave, clientName, ticketId }: WorkOrderModalProps) {
    const [description, setDescription] = useState('');
    const [selectedClient, setSelectedClient] = useState(clientName || '');
    const [tasks, setTasks] = useState<TaskData[]>([]);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [urgency, setUrgency] = useState<WorkOrderData['urgency']>('medium');
    const [expectedCompletion, setExpectedCompletion] = useState<number>(new Date().getTime() + (604800000));
    const workOrderSlice = useSelector((state: RootState) => state.workOrders);
    const clients = useSelector(selectClients);
    const handleAddTask = () => {
        if (!newTaskTitle.trim())
            return;
        const newTask: TaskData = {
            id: Date.now().toString(),
            title: newTaskTitle,
            status: 'not-started'
        };
        setTasks([...tasks, newTask]);
        setNewTaskTitle('');
    };
    const handleRemoveTask = (taskId: string) => {
        setTasks(tasks.filter(t => t.id !== taskId));
    };
    const handleSave = () => {
        if (!description.trim() || !selectedClient || tasks.length === 0 || !expectedCompletion)
            return;
        onSave({
            description,
            clientName: selectedClient,
            tasks,
            ticketId,
            urgency,
            expectedCompletion
        });
        setDescription('');
        setSelectedClient(clientName || '');
        setTasks([]);
        setUrgency('medium');
        setExpectedCompletion(0);
        onClose();
    };
    const handleClose = () => {
        setDescription('');
        setSelectedClient(clientName || '');
        setTasks([]);
        setUrgency('medium');
        setExpectedCompletion(0);
        onClose();
    };
    const getUrgencyColor = (u: WorkOrderData['urgency']) => {
        switch (u) {
            case 'low':
                return 'bg-slate-600 text-slate-100 border-slate-500';
            case 'medium':
                return 'bg-blue-600 text-blue-100 border-blue-500';
            case 'high':
                return 'bg-orange-600 text-orange-100 border-orange-500';
            case 'urgent':
                return 'bg-red-600 text-red-100 border-red-500';
        }
    };
    if (!isOpen)
        return null;
    return (<div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 flex items-center justify-center">
                <span aria-hidden="true">{iconLabel("ri-file-list-3-line text-blue-400 text-xl")}</span>
              </div>
              <h3>Create Work Order</h3>
            </div>
            <button onClick={handleClose} className="w-8 h-8 flex items-center justify-center">
              <span aria-hidden="true">{iconLabel("ri-close-line text-xl")}</span>
            </button>
          </div>

          <div>
            <div>
              <label className="block">Description</label>
              <textarea className="w-full" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Enter work order description..." rows={3} maxLength={500}/>
              <p>{description.length}/500</p>
            </div>

            <div>
              <label className="block">Client</label>
              {clientName ? (<div className="w-full">
                  {clientName}
                </div>) : (<div className="relative">
                  <select className="w-full" value={selectedClient} onChange={(e) => setSelectedClient(e.target.value)}>
                    <option value="">Select a client...</option>
                    {clients.map((client) => (<option key={client.id} value={client.businessName}>{client.businessName} / {client.businessId}</option>))}
                  </select>
                  <span aria-hidden="true">{iconLabel("ri-arrow-down-s-line absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none")}</span>
                </div>)}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block">Urgency</label>
                <div className="flex flex-wrap gap-2">
                  {(['low', 'medium', 'high', 'urgent'] as const).map((u) => (<button key={u} onClick={() => setUrgency(u)} className={uiClasses(`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all cursor-pointer border ${urgency === u
            ? getUrgencyColor(u)
            : 'bg-slate-700 text-slate-400 border-slate-600 hover:border-slate-500'}`)}>
                      {u}
                    </button>))}
                </div>
              </div>

              <div>
                <label className="block">Expected Completion</label>
                <input className="w-full" type="date" defaultValue={new Date().getTime()} value={new Date(expectedCompletion).toISOString().split('T')[0]} onChange={(e) => setExpectedCompletion(new Date(e.target.value).getTime())} min={new Date().toISOString().split('T')[0]}/>
              </div>
            </div>

            <div>
              <label className="block">Pages/Features</label>
              <div className="flex">
                <input className="flex-1" type="text" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleAddTask()} placeholder="Add a page or feature..."/>
                <button onClick={handleAddTask} disabled={!newTaskTitle.trim()}>
                  Add
                </button>
              </div>

              {tasks.length > 0 ? (<div className="max-h-40 overflow-y-auto">
                  {tasks.map((task) => (<div key={task.id} className="flex items-center justify-between">
                      <span>{task.title}</span>
                      <button onClick={() => handleRemoveTask(task.id)} className="w-6 h-6 flex items-center justify-center">
                        <span aria-hidden="true">{iconLabel("ri-close-line")}</span>
                      </button>
                    </div>))}
                </div>) : (<div>
                  No tasks added yet
                </div>)}
            </div>
          </div>

          <div className="flex">
            <button className="flex-1" onClick={handleClose}>
              Cancel
            </button>
            <button className="flex-1" onClick={handleSave} disabled={!description.trim() || !selectedClient || tasks.length === 0 || !expectedCompletion}>
              {workOrderSlice.loadingUpload ? 'Creating...' : 'Create Work Order'}
            </button>
          </div>
        </div>
      </div>
    </div>);
}

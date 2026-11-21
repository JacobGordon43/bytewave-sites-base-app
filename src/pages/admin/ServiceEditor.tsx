import { uiClasses, iconLabel } from "../../utils/presentation";
import { useState } from "react";
import type { ServiceData } from "../../types/daoTypes";
import { v4 as uuidv4 } from "uuid";
import { colorOptions } from "../../utils/colorClasses";
interface ServiceEditorProps {
    service: ServiceData | null;
    totalServices: number;
    onSave: (service: ServiceData) => void;
    onCancel: () => void;
}
const iconOptions = [
    { value: 'ri-code-line', label: 'Code' },
    { value: 'ri-palette-line', label: 'Palette' },
    { value: 'ri-server-line', label: 'Server' },
    { value: 'ri-cloud-line', label: 'Cloud' },
    { value: 'ri-smartphone-line', label: 'Mobile' },
    { value: 'ri-shopping-cart-line', label: 'E-commerce' },
    { value: 'ri-shield-check-line', label: 'Security' },
    { value: 'ri-speed-line', label: 'Performance' },
    { value: 'ri-database-2-line', label: 'Database' },
    { value: 'ri-global-line', label: 'Global' },
    { value: 'ri-mail-line', label: 'Email' },
    { value: 'ri-customer-service-2-line', label: 'Support' },
];
export default function ServiceEditor({ service, onSave, onCancel, totalServices }: ServiceEditorProps) {
    const [formData, setFormData] = useState<ServiceData>(service || {
        id: uuidv4(),
        index: totalServices,
        icon: 'ri-code-line',
        title: '',
        subtitle: '',
        price: '',
        description: '',
        shortDescription: '',
        primaryList: {
            id: 'primary',
            title: "What's Included:",
            items: [{ id: '1', text: '' }]
        },
        secondaryLists: [],
        featured: false,
        serviceColor: 'blue'
    });
    const [showIconPicker, setShowIconPicker] = useState(false);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const handleAddPrimaryItem = () => {
        setFormData({
            ...formData,
            primaryList: {
                ...formData.primaryList,
                items: [...formData.primaryList.items, { id: uuidv4(), text: '' }]
            }
        });
    };
    const handleRemovePrimaryItem = (itemId: string) => {
        setFormData({
            ...formData,
            primaryList: {
                ...formData.primaryList,
                items: formData.primaryList.items.filter(item => item.id !== itemId)
            }
        });
    };
    const handleUpdatePrimaryItem = (itemId: string, text: string) => {
        setFormData({
            ...formData,
            primaryList: {
                ...formData.primaryList,
                items: formData.primaryList.items.map(item => item.id === itemId ? { ...item, text } : item)
            }
        });
    };
    const handleAddSecondaryList = () => {
        setFormData({
            ...formData,
            secondaryLists: [
                ...formData.secondaryLists,
                {
                    id: uuidv4(),
                    title: "New Section",
                    items: [{ id: uuidv4(), text: '' }]
                }
            ]
        });
    };
    const handleRemoveSecondaryList = (listId: string) => {
        setFormData({
            ...formData,
            secondaryLists: formData.secondaryLists.filter(list => list.id !== listId)
        });
    };
    const handleAddSecondaryItem = (listId: string) => {
        setFormData({
            ...formData,
            secondaryLists: formData.secondaryLists.map(list => list.id === listId ? { ...list, items: [...list.items, { id: uuidv4(), text: '' }] } : list)
        });
    };
    const handleUpdateSecondaryListTitle = (listId: string, title: string) => {
        setFormData({
            ...formData,
            secondaryLists: formData.secondaryLists.map(list => list.id === listId ? { ...list, title } : list)
        });
    };
    const handleRemoveSecondaryItem = (listId: string, itemId: string) => {
        setFormData({
            ...formData,
            secondaryLists: formData.secondaryLists.map(list => list.id === listId ? { ...list, items: list.items.filter(item => item.id !== itemId) } : list)
        });
    };
    const handleUpdateSecondaryItem = (listId: string, itemId: string, text: string) => {
        setFormData({
            ...formData,
            secondaryLists: formData.secondaryLists.map(list => list.id === listId ?
                {
                    ...list,
                    items: list.items.map(item => item.id === itemId ? { ...item, text } : item)
                } : list)
        });
    };
    const handleColorSelect = (color: typeof colorOptions[0]) => {
        setFormData({
            ...formData,
            serviceColor: color.value,
        });
        setShowColorPicker(false);
    };
    const handleSubmit = () => {
        if (!formData.title.trim())
            return;
        onSave(formData);
    };
    return (<div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
      <div>
        <h3>Edit Service</h3>

        <div>
          <div className="flex items-start gap-4">
            <div className="relative">
              <label className="block">Icon</label>
              <button onClick={() => setShowIconPicker(!showIconPicker)} disabled={formData.featured} className={uiClasses(`w-16 h-16 bg-${formData.serviceColor}-600 rounded-xl flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity`)}>
                <span aria-hidden="true">{iconLabel(`${formData.icon} text-white text-2xl`)}</span>
              </button>
              {showIconPicker && (<div className="absolute top-full left-0 grid grid-cols-3 gap-3 z-10 w-64">
                  {iconOptions.map((icon) => (<button key={icon.value} onClick={() => {
                    setFormData({ ...formData, icon: icon.value });
                    setShowIconPicker(false);
                }} className={uiClasses(`flex flex-col items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors ${formData.icon === icon.value ? 'bg-blue-600' : 'bg-slate-600 hover:bg-slate-500'}`)}>
                      <span aria-hidden="true">{iconLabel(`${icon.value} text-white text-2xl`)}</span>
                      <span>{icon.label}</span>
                    </button>))}
                </div>)}
            </div>

            <div className="relative">
              <label className="block">Color</label>
              <button onClick={() => setShowColorPicker(!showColorPicker)} disabled={formData.featured} className={uiClasses(`w-16 h-16 bg-${formData.serviceColor}-600 rounded-xl flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity`)}>
                <span aria-hidden="true">{iconLabel("ri-palette-line text-white text-xl")}</span>
              </button>
              {showColorPicker && (<div className="absolute top-full left-0 grid grid-cols-2 gap-3 z-10 w-64">
                  {colorOptions.map((color) => (<button key={color.value} onClick={() => handleColorSelect(color)} className={uiClasses(`flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-slate-600 transition-colors ${formData.serviceColor === color.value ? 'ring-2 ring-white' : ''}`)}>
                      <div className={uiClasses(`w-10 h-10 bg-${color.value}-600 rounded-lg flex-shrink-0`)}></div>
                      <span>{color.label}</span>
                    </button>))}
                </div>)}
            </div>
          </div>

          <div>
            <label className="block">Title</label>
            <input className="w-full" type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g., Web Development"/>
          </div>

          <div>
            <label className="block">Subtitle (Price/Info)</label>
            <input className="w-full" type="text" value={formData.subtitle} onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })} placeholder="e.g., Starting at $50"/>
          </div>

          <div>
            <label className="block">Price</label>
            <input className="w-full" type="text" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} placeholder="e.g., $50+"/>
          </div>

          <div>
            <label className="block">Description</label>
            <textarea className="w-full" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Describe this service..." rows={3} maxLength={500}/>
          </div>

          <div>
            <label className="block">Short Description</label>
            <textarea className="w-full" value={formData.shortDescription} onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })} placeholder="A brief description of this service..." rows={2} maxLength={100}/>
          </div>

          <div className="flex items-center gap-3">
            <input className="w-5 h-5" type="checkbox" id="gradient" checked={formData.featured} onChange={(e) => setFormData({ ...formData, featured: e.target.checked, serviceColor: 'purple' })}/>
            <label htmlFor="gradient">Use gradient background (featured service)</label>
          </div>
          {formData.featured && (<div>
              <div>
                <label className="block">Featured Service Title</label>
                <input className="w-full" type="text" value={formData.featuredTitle || ''} onChange={(e) => setFormData({ ...formData, featuredTitle: e.target.value })} placeholder="e.g., Premium Web Solutions"/>
              </div>
              <div>
                <label className="block">Featured Service Description</label>
                <textarea className="w-full" value={formData.featuredDescription || ''} onChange={(e) => setFormData({ ...formData, featuredDescription: e.target.value })} placeholder="Short description for the featured service..." rows={2} maxLength={500}/>
              </div>
            </div>)}

          <div>
            <div className="flex items-center justify-between">
              <label>Primary List Section</label>
            </div>
            <input className="w-full" type="text" value={formData.primaryList.title} onChange={(e) => setFormData({
            ...formData,
            primaryList: { ...formData.primaryList, title: e.target.value }
        })} placeholder="Section title (e.g., What's Included:)"/>
            <div>
              {formData.primaryList.items.map((item, index) => (<div key={item.id} className="flex items-center gap-2">
                  <span aria-hidden="true">{iconLabel("ri-check-line text-green-400")}</span>
                  <input className="flex-1" type="text" value={item.text} onChange={(e) => handleUpdatePrimaryItem(item.id, e.target.value)} placeholder={`Item ${index + 1}`}/>
                  {formData.primaryList.items.length > 1 && (<button onClick={() => handleRemovePrimaryItem(item.id)} className="w-8 h-8 flex items-center justify-center">
                      <span aria-hidden="true">{iconLabel("ri-delete-bin-line")}</span>
                    </button>)}
                </div>))}
            </div>
            <button onClick={handleAddPrimaryItem} className="flex items-center gap-1">
              <span aria-hidden="true">{iconLabel("ri-add-line")}</span> Add Item
            </button>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label>Secondary List Sections</label>
              <button onClick={handleAddSecondaryList} className="flex items-center gap-1">
                <span aria-hidden="true">{iconLabel("ri-add-line")}</span> Add Section
              </button>
            </div>

            {formData.secondaryLists.map((list) => (<div key={list.id}>
                <div className="flex items-center justify-between">
                  <input className="flex-1" type="text" value={list.title} onChange={(e) => handleUpdateSecondaryListTitle(list.id, e.target.value)} placeholder="Section title"/>
                  <button onClick={() => handleRemoveSecondaryList(list.id)} className="w-8 h-8 flex items-center justify-center">
                    <span aria-hidden="true">{iconLabel("ri-delete-bin-line")}</span>
                  </button>
                </div>
                <div>
                  {list.items.map((item, index) => (<div key={item.id} className="flex items-center gap-2">
                      <span>•</span>
                      <input className="flex-1" type="text" value={item.text} onChange={(e) => handleUpdateSecondaryItem(list.id, item.id, e.target.value)} placeholder={`Item ${index + 1}`}/>
                      {list.items.length > 1 && (<button onClick={() => handleRemoveSecondaryItem(list.id, item.id)} className="w-8 h-8 flex items-center justify-center">
                          <span aria-hidden="true">{iconLabel("ri-delete-bin-line")}</span>
                        </button>)}
                    </div>))}
                </div>
                <button onClick={() => handleAddSecondaryItem(list.id)} className="flex items-center gap-1">
                  <span aria-hidden="true">{iconLabel("ri-add-line")}</span> Add Item
                </button>
              </div>))}

            {formData.secondaryLists.length === 0 && (<p>No secondary sections added yet.</p>)}
          </div>
        </div>

        <div className="flex gap-3">
          <button className="flex-1" onClick={onCancel}>
            Cancel
          </button>
          <button className="flex-1" onClick={handleSubmit}>
            Save Service
          </button>
        </div>
      </div>

      <div>
        <h3>Live Preview</h3>
        <div>
          <p>This is how your service will appear on the Services page:</p>
          
          <div className={uiClasses(`${formData.featured ? 'bg-gradient-to-br from-blue-600 to-purple-600' : 'bg-slate-700'} rounded-2xl p-8 border ${formData.featured ? 'border-transparent' : 'border-slate-600'}`)}>
            <div className="flex items-center">
              <div className={uiClasses(`w-16 h-16 ${formData.featured ? 'bg-white/20' : `bg-${formData.serviceColor}-600`} rounded-xl flex items-center justify-center mr-4`)}>
                <span aria-hidden="true">{iconLabel(`${formData.icon} text-white text-2xl`)}</span>
              </div>
              <div>
                <h3>{formData.title || 'Service Title'}</h3>
                <p className={uiClasses(`${formData.featured ? 'text-blue-100' : `text-${formData.serviceColor}-400`} font-semibold`)}>
                  {formData.subtitle || 'Subtitle/Price'}
                </p>
              </div>
            </div>
            
            <p className={uiClasses(`${formData.featured ? 'text-blue-100' : 'text-slate-300'} mb-6`)}>
              {formData.description || 'Service description will appear here...'}
            </p>
            
            {formData.primaryList.items.some(item => item.text) && (<div>
                <h4>{formData.primaryList.title}</h4>
                <ul className={uiClasses(`space-y-2 ${formData.featured ? 'text-blue-100' : 'text-slate-300'}`)}>
                  {formData.primaryList.items.filter(item => item.text).map((item) => (<li key={item.id} className="flex items-center">
                      <span aria-hidden="true">{iconLabel(`ri-check-line ${formData.featured ? 'text-green-300' : 'text-green-400'} mr-2`)}</span>
                      {item.text}
                    </li>))}
                </ul>
              </div>)}
            
            {formData.secondaryLists.map((list) => (list.items.some(item => item.text) && (<div key={list.id} className={uiClasses(`${formData.featured ? 'bg-white/10' : 'bg-slate-600'} p-4 rounded-lg mb-4`)}>
                  <h5>{list.title}</h5>
                  <div className={uiClasses(`text-sm ${formData.featured ? 'text-blue-100' : 'text-slate-300'} space-y-1`)}>
                    {list.items.filter(item => item.text).map((item) => (<div key={item.id}>• {item.text}</div>))}
                  </div>
                </div>)))}
          </div>
        </div>
      </div>
    </div>);
}

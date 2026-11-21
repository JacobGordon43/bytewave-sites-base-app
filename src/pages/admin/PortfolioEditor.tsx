'use client';
import { uiClasses, iconLabel } from "../../utils/presentation";
import { useState, useRef } from 'react';
import type { PortfolioData } from '../../types/daoTypes';
import { v4 as uuidv4 } from "uuid";
interface PortfolioEditorProps {
    item: PortfolioData | null;
    categories: string[];
    onSave: (item: PortfolioData) => void;
    onCancel: () => void;
}
const defaultCategories = [
    'Technology', 'Restaurant', 'Consulting', 'Fitness', 'Marketing',
    'Church', 'Legal', 'Hospitality', 'Architecture', 'Healthcare',
    'Education', 'Real Estate', 'Retail', 'Nonprofit', 'Entertainment'
];
export default function PortfolioEditor({ item, categories, onSave, onCancel }: PortfolioEditorProps) {
    const [formData, setFormData] = useState<PortfolioData>(item || {
        id: uuidv4(),
        title: '',
        category: '',
        description: '',
        website: '',
        imageUrl: '',
    });
    const [customCategory, setCustomCategory] = useState('');
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const allCategories = [...new Set([...defaultCategories, ...categories])].sort();
    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.title.trim())
            newErrors.title = 'Title is required';
        if (!formData.category.trim())
            newErrors.category = 'Category is required';
        if (!formData.description.trim())
            newErrors.description = 'Description is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const handleImageUpload = (file: File) => {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const imageUrl = e.target?.result as string;
                setFormData((prev) => ({ ...prev, imageUrl: imageUrl, imageFile: file }));
            };
            reader.readAsDataURL(file);
        }
    };
    const handleRemoveImage = () => {
        setFormData((prev) => ({ ...prev, image: '', imagePrompt: '' }));
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };
    const handleSave = () => {
        if (!validate())
            return;
        onSave({ ...formData });
    };
    const handleSelectCategory = (cat: string) => {
        setFormData({ ...formData, category: cat });
        setShowCategoryDropdown(false);
        setCustomCategory('');
    };
    const handleAddCustomCategory = () => {
        if (customCategory.trim()) {
            setFormData({ ...formData, category: customCategory.trim() });
            setShowCategoryDropdown(false);
            setCustomCategory('');
        }
    };
    const previewImage = formData.imageUrl || '';
    return (<div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
      <div>
        <div className="flex items-center gap-3">
          <button onClick={onCancel} className="w-8 h-8 flex items-center justify-center">
            <span aria-hidden="true">{iconLabel("ri-arrow-left-line text-xl")}</span>
          </button>
          <h3>{item ? 'Edit Project' : 'Add New Project'}</h3>
        </div>

        <div>
          <div>
            <label className="block">Project Title *</label>
            <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g., TechStart Solutions" className={uiClasses(`w-full bg-slate-700 border ${errors.title ? 'border-red-500' : 'border-slate-600'} rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500`)}/>
            {errors.title && <p>{errors.title}</p>}
          </div>

          <div className="relative">
            <label className="block">Category *</label>
            <button onClick={() => setShowCategoryDropdown(!showCategoryDropdown)} className={uiClasses(`w-full bg-slate-700 border ${errors.category ? 'border-red-500' : 'border-slate-600'} rounded-lg px-4 py-3 text-left flex items-center justify-between cursor-pointer hover:border-slate-500 transition-colors`)}>
              <span className={uiClasses(formData.category ? 'text-white' : 'text-slate-400')}>
                {formData.category || 'Select a category'}
              </span>
              <span aria-hidden="true">{iconLabel(`ri-arrow-${showCategoryDropdown ? 'up' : 'down'}-s-line text-slate-400`)}</span>
            </button>
            {errors.category && <p>{errors.category}</p>}
            {showCategoryDropdown && (<div className="absolute top-full left-0 right-0 z-20 max-h-64 overflow-y-auto">
                <div>
                  <div className="flex gap-2">
                    <input className="flex-1" type="text" value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} placeholder="Type custom category..." onKeyDown={(e) => e.key === 'Enter' && handleAddCustomCategory()}/>
                    <button onClick={handleAddCustomCategory}>
                      Add
                    </button>
                  </div>
                </div>
                {allCategories.map((cat) => (<button key={cat} onClick={() => handleSelectCategory(cat)} className={uiClasses(`w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer ${formData.category === cat ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-600'}`)}>
                    {cat}
                  </button>))}
              </div>)}
          </div>

          <div>
            <label className="block">Description *</label>
            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Describe the project..." rows={3} maxLength={500} className={uiClasses(`w-full bg-slate-700 border ${errors.description ? 'border-red-500' : 'border-slate-600'} rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 resize-none`)}/>
            {errors.description && <p>{errors.description}</p>}
          </div>

          <div>
            <label className="block">Website URL</label>
            <input className="w-full" type="text" value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} placeholder="https://example.com"/>
          </div>

          <div>
            <label className="block">Project Image</label>
            <input type="file" ref={fileInputRef} accept="image/*" onChange={(e) => {
            const file = e.target.files?.[0];
            if (file)
                handleImageUpload(file);
        }} className="hidden"/>
            {formData.imageUrl ? (<div>
                <div className="relative">
                  <img className="w-full h-48" src={formData.imageUrl} alt="Preview"/>
                  <button onClick={handleRemoveImage} className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center">
                    <span aria-hidden="true">{iconLabel("ri-close-line text-white text-sm")}</span>
                  </button>
                </div>
                <button className="w-full" onClick={() => fileInputRef.current?.click()}>
                  Change Image
                </button>
              </div>) : (<button onClick={() => fileInputRef.current?.click()} className="w-full flex flex-col items-center justify-center gap-2">
                <span aria-hidden="true">{iconLabel("ri-upload-cloud-line text-slate-400 text-3xl")}</span>
                <span>Click to upload project image</span>
                <span>PNG, JPG, GIF up to 10MB</span>
              </button>)}
          </div>
        </div>

        <div className="flex gap-3">
          <button className="flex-1" onClick={onCancel}>
            Cancel
          </button>
          <button className="flex-1" onClick={handleSave}>
            <span aria-hidden="true">{iconLabel("ri-save-line mr-2")}</span>
            Save Project
          </button>
        </div>
      </div>

      <div>
        <h3>Live Preview</h3>
        <div>
          <p>This is how your project will appear on the Portfolio page:</p>
          <div className="relative group overflow-hidden">
            {previewImage ? (<img className="w-full h-full" src={previewImage} alt={formData.title || 'Preview'}/>) : (<div className="w-full h-full flex flex-col items-center justify-center">
                <span aria-hidden="true">{iconLabel("ri-image-line text-4xl mb-2")}</span>
                <p>Add an image description or URL to preview</p>
              </div>)}
            <div className="absolute inset-0 flex items-center justify-center">
              <div>
                <h3>{formData.title || 'Project Title'}</h3>
                <p>
                  {formData.description || 'Project description will appear here...'}
                </p>
                {formData.website && (<div className="inline-flex items-center">
                    Visit Website
                    <span aria-hidden="true">{iconLabel("ri-external-link-line ml-2")}</span>
                  </div>)}
              </div>
            </div>
            {formData.category && (<div className="absolute top-4 left-4 z-10">
                {formData.category}
              </div>)}
          </div>
        </div>
      </div>
    </div>);
}

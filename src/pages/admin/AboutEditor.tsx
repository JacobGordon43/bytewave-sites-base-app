import { uiClasses, iconLabel } from "../../utils/presentation";
import { useRef, useState } from "react";
import type { AboutSectionData, ContentBlockData } from "../../types/daoTypes";
import { v4 as uuidv4 } from "uuid";
import DOMPurify from 'dompurify';
interface AboutEditorProps {
    section: AboutSectionData | null;
    onSave: (section: AboutSectionData) => void;
    onCancel: () => void;
    totalSections: number;
}
const iconOptions = [
    { value: 'ri-award-line', label: 'Award' },
    { value: 'ri-customer-service-2-line', label: 'Support' },
    { value: 'ri-rocket-line', label: 'Rocket' },
    { value: 'ri-shield-check-line', label: 'Shield' },
    { value: 'ri-team-line', label: 'Team' },
    { value: 'ri-heart-line', label: 'Heart' },
    { value: 'ri-lightbulb-line', label: 'Idea' },
    { value: 'ri-star-line', label: 'Star' },
    { value: 'ri-code-line', label: 'Code' },
    { value: 'ri-global-line', label: 'Global' },
    { value: 'ri-time-line', label: 'Time' },
    { value: 'ri-money-dollar-circle-line', label: 'Money' },
];
const colorOptions = [
    { value: 'bg-blue-600', label: 'Blue' },
    { value: 'bg-purple-600', label: 'Purple' },
    { value: 'bg-green-600', label: 'Green' },
    { value: 'bg-orange-600', label: 'Orange' },
    { value: 'bg-cyan-600', label: 'Cyan' },
    { value: 'bg-red-600', label: 'Red' },
    { value: 'bg-pink-600', label: 'Pink' },
    { value: 'bg-indigo-600', label: 'Indigo' },
];
const bgOptions = [
    { value: 'bg-slate-900', label: 'Dark' },
    { value: 'bg-slate-800', label: 'Medium' },
    { value: 'bg-slate-700', label: 'Light' },
];
export default function AboutEditor({ section, onSave, onCancel, totalSections }: AboutEditorProps) {
    const createEmptyBlocks = (cols: number, rows: number): ContentBlockData[] => {
        const blocks: ContentBlockData[] = [];
        for (let i = 0; i < cols * rows; i++) {
            blocks.push({
                id: uuidv4(),
                type: 'text',
                title: '',
                description: '',
                icon: 'ri-star-line',
                iconColor: 'bg-blue-600'
            });
        }
        return blocks;
    };
    const [formData, setFormData] = useState<AboutSectionData>(section || {
        id: uuidv4(),
        index: totalSections,
        title: '',
        subtitle: '',
        columns: 2,
        rows: 1,
        isCard: true,
        cardType: 'icon',
        backgroundColor: 'bg-slate-900',
        blocks: createEmptyBlocks(2, 1)
    });
    const [activeBlockIndex, setActiveBlockIndex] = useState<number | null>(null);
    const [showIconPicker, setShowIconPicker] = useState<number | null>(null);
    const [showColorPicker, setShowColorPicker] = useState<number | null>(null);
    const fileInputRefs = useRef<{
        [key: number]: HTMLInputElement | null;
    }>({});
    const handleGridChange = (cols: 1 | 2 | 3, rows: number) => {
        const totalBlocks = cols * rows;
        let newBlocks = [...formData.blocks];
        if (newBlocks.length < totalBlocks) {
            for (let i = newBlocks.length; i < totalBlocks; i++) {
                newBlocks.push({
                    id: uuidv4(),
                    type: 'text',
                    title: '',
                    description: '',
                    icon: 'ri-star-line',
                    iconColor: 'bg-blue-600'
                });
            }
        }
        else if (newBlocks.length > totalBlocks) {
            newBlocks = newBlocks.slice(0, totalBlocks);
        }
        setFormData({ ...formData, columns: cols, rows: rows, blocks: newBlocks });
    };
    const handleBlockUpdate = (index: number, updates: Partial<ContentBlockData>) => {
        const newBlocks = [...formData.blocks];
        newBlocks[index] = { ...newBlocks[index], ...updates };
        setFormData({ ...formData, blocks: newBlocks });
    };
    const handleImageUpload = (index: number, file: File) => {
        if (file && file.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const imageUrl = e.target?.result as string;
                handleBlockUpdate(index, { imageUrl, imageFile: file });
            };
            reader.readAsDataURL(file);
        }
    };
    const handleRemoveImage = (index: number) => {
        handleBlockUpdate(index, { imageUrl: '' });
    };
    const handleSubmit = () => {
        onSave(formData);
    };
    const getGridCols = () => {
        switch (formData.columns) {
            case 1: return 'grid-cols-1';
            case 2: return 'grid-cols-1 md:grid-cols-2';
            case 3: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
            default: return 'grid-cols-1';
        }
    };
    return (<div className="flex flex-col gap-8">
      <div className="overflow-y-auto">
        <h3>Edit Section</h3>

        <div>
          <div>
            <label className="block">Section Title</label>
            <input className="w-full" type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g., Our Values"/>
          </div>

          <div>
            <label className="block">Section Subtitle (Optional)</label>
            <input className="w-full" type="text" value={formData.subtitle || ''} onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })} placeholder="e.g., The principles that guide us"/>
          </div>

          <div>
            <label className="block">Background Color</label>
            <div className="flex gap-2">
              {bgOptions.map((bg) => (<button key={bg.value} onClick={() => setFormData({ ...formData, backgroundColor: bg.value })} className={uiClasses(`px-4 py-2 rounded-lg text-sm cursor-pointer transition-all ${bg.value} ${formData.backgroundColor === bg.value ? 'ring-2 ring-blue-500' : ''} text-white`)}>
                  {bg.label}
                </button>))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block">Columns (1-3)</label>
              <div className="flex gap-2">
                {[1, 2, 3].map((col) => (<button key={col} onClick={() => handleGridChange(col as 1 | 2 | 3, formData.rows)} className={uiClasses(`flex-1 py-2 rounded-lg text-sm cursor-pointer transition-colors ${formData.columns === col ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`)}>
                    {col}
                  </button>))}
              </div>
            </div>

            <div>
              <label className="block">Rows</label>
              <div className="flex items-center gap-2">
                <button onClick={() => {
            if (formData.rows > 1) {
                handleGridChange(formData.columns, (formData.rows - 1) as 1 | 2 | 3 | 4 | 5);
            }
        }} className="w-10 h-10 flex items-center justify-center">
                  <span aria-hidden="true">{iconLabel("ri-subtract-line")}</span>
                </button>
                <input className="w-16 h-10" type="number" min={1} max={10} value={formData.rows} onChange={(e) => {
            const val = parseInt(e.target.value) || 1;
            if (val >= 1 && val <= 10) {
                handleGridChange(formData.columns, val as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10);
            }
        }}/>
                <button onClick={() => {
            if (formData.rows < 10) {
                handleGridChange(formData.columns, (formData.rows + 1));
            }
        }} className="w-10 h-10 flex items-center justify-center">
                  <span aria-hidden="true">{iconLabel("ri-add-line")}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <input className="w-5 h-5" type="checkbox" id="isCard" checked={formData.isCard} onChange={(e) => setFormData({ ...formData, isCard: e.target.checked })}/>
              <label htmlFor="isCard">Display as cards</label>
            </div>
          </div>

          {formData.isCard && (<div>
              <label className="block">Card Style</label>
              <div className="flex gap-2">
                <button onClick={() => setFormData({ ...formData, cardType: 'none' })} className={uiClasses(`flex-1 py-2 px-3 rounded-lg text-xs cursor-pointer transition-colors flex items-center justify-center gap-1 ${formData.cardType === 'none' ? 'bg-blue-600 text-white' : 'bg-slate-600 text-slate-300 hover:bg-slate-500'}`)}>
                  <span aria-hidden="true">{iconLabel("ri-close-circle-line")}</span> None
                </button>
                <button onClick={() => setFormData({ ...formData, cardType: 'icon' })} className={uiClasses(`flex-1 py-2 px-4 rounded-lg text-sm cursor-pointer transition-colors flex items-center justify-center gap-2 ${formData.cardType === 'icon' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`)}>
                  <span aria-hidden="true">{iconLabel("ri-star-line")}</span> With Icon
                </button>
                <button onClick={() => setFormData({ ...formData, cardType: 'image' })} className={uiClasses(`flex-1 py-2 px-4 rounded-lg text-sm cursor-pointer transition-colors flex items-center justify-center gap-2 ${formData.cardType === 'image' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`)}>
                  <span aria-hidden="true">{iconLabel("ri-image-line")}</span> With Image
                </button>
              </div>
            </div>)}

          <div>
            <label className="block">Content Blocks ({formData.blocks.length})</label>
            
            <div>
              {formData.blocks.map((block, index) => (<div key={block.id} className={uiClasses(`bg-slate-700/50 rounded-lg p-4 cursor-pointer transition-all ${activeBlockIndex === index ? 'ring-2 ring-blue-500' : 'hover:bg-slate-700'}`)} onClick={() => setActiveBlockIndex(activeBlockIndex === index ? null : index)}>
                  <div className="flex items-center justify-between">
                    <span>Block {index + 1}</span>
                    <div className="flex gap-2">
                      <button onClick={(e) => {
                e.stopPropagation();
                handleBlockUpdate(index, { type: 'text' });
            }} className={uiClasses(`px-3 py-1 rounded text-xs cursor-pointer ${block.type === 'text' ? 'bg-blue-600 text-white' : 'bg-slate-600 text-slate-300'}`)}>
                        Text
                      </button>
                      <button onClick={(e) => {
                e.stopPropagation();
                handleBlockUpdate(index, { type: 'image' });
            }} className={uiClasses(`px-3 py-1 rounded text-xs cursor-pointer ${block.type === 'image' ? 'bg-blue-600 text-white' : 'bg-slate-600 text-slate-300'}`)}>
                        Image
                      </button>
                    </div>
                  </div>

                  {activeBlockIndex === index && (<div onClick={(e) => e.stopPropagation()}>
                      {block.type === 'text' ? (<>
                          {formData.isCard && formData.cardType === 'icon' && (<div className="flex items-center gap-3">
                              <div className="relative">
                                <label className="block">Icon</label>
                                <button onClick={() => setShowIconPicker(showIconPicker === index ? null : index)} className={uiClasses(`w-12 h-12 ${block.iconColor || 'bg-blue-600'} rounded-lg flex items-center justify-center cursor-pointer`)}>
                                  <span aria-hidden="true">{iconLabel(`${block.icon || 'ri-star-line'} text-white text-xl`)}</span>
                                </button>
                                {showIconPicker === index && (<div className="absolute top-full left-0 grid grid-cols-4 gap-2 z-20 w-56">
                                    {iconOptions.map((icon) => (<button key={icon.value} onClick={() => {
                                    handleBlockUpdate(index, { icon: icon.value });
                                    setShowIconPicker(null);
                                }} className={uiClasses(`flex flex-col items-center gap-1 p-2 rounded cursor-pointer transition-colors ${block.icon === icon.value ? 'bg-blue-600' : 'bg-slate-600 hover:bg-slate-500'}`)}>
                                        <span aria-hidden="true">{iconLabel(`${icon.value} text-white text-lg`)}</span>
                                        <span>{icon.label}</span>
                                      </button>))}
                                  </div>)}
                              </div>
                              <div className="relative">
                                <label className="block">Color</label>
                                <button onClick={() => setShowColorPicker(showColorPicker === index ? null : index)} className={uiClasses(`w-12 h-12 ${block.iconColor || 'bg-blue-600'} rounded-lg flex items-center justify-center cursor-pointer`)}>
                                  <span aria-hidden="true">{iconLabel("ri-palette-line text-white")}</span>
                                </button>
                                {showColorPicker === index && (<div className="absolute top-full left-0 grid grid-cols-2 gap-2 z-20 w-48">
                                    {colorOptions.map((color) => (<button key={color.value} onClick={() => {
                                    handleBlockUpdate(index, { iconColor: color.value });
                                    setShowColorPicker(null);
                                }} className={uiClasses(`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-slate-600 ${block.iconColor === color.value ? 'ring-2 ring-white' : ''}`)}>
                                        <div className={uiClasses(`w-6 h-6 ${color.value} rounded`)}></div>
                                        <span>{color.label}</span>
                                      </button>))}
                                  </div>)}
                              </div>
                            </div>)}
                          {formData.isCard && formData.cardType === 'image' && (<div>
                              <label className="block">Card Image</label>
                              <input type="file" ref={(el) => { fileInputRefs.current[index] = el; }} accept="image/*" onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file)
                                handleImageUpload(index, file);
                        }} className="hidden"/>
                              {block.imageUrl ? (<div>
                                  <div className="relative">
                                    <img className="w-full h-32" src={block.imageUrl} alt="Preview"/>
                                    <button onClick={() => handleRemoveImage(index)} className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center">
                                      <span aria-hidden="true">{iconLabel("ri-close-line text-white text-sm")}</span>
                                    </button>
                                  </div>
                                  <button className="w-full" onClick={() => fileInputRefs.current[index]?.click()}>
                                    Change Image
                                  </button>
                                </div>) : (<button onClick={() => fileInputRefs.current[index]?.click()} className="w-full flex flex-col items-center justify-center gap-2">
                                  <span aria-hidden="true">{iconLabel("ri-upload-cloud-line text-slate-400 text-2xl")}</span>
                                  <span>Click to upload card image</span>
                                  <span>PNG, JPG, GIF up to 10MB</span>
                                </button>)}
                            </div>)}
                          <div>
                            <label className="block">Title</label>
                            <input className="w-full" type="text" value={block.title || ''} onChange={(e) => handleBlockUpdate(index, { title: e.target.value })} placeholder="Title"/>
                          </div>
                          <div>
                            <label className="block">Description</label>
                            <textarea className="w-full" value={block.description || ''} onChange={(e) => handleBlockUpdate(index, { description: e.target.value })} placeholder="Description"/>
                            
                            
                          </div>
                        </>) : (<>
                          <div>
                            <label className="block">Upload Image</label>
                            <input type="file" ref={(el) => { fileInputRefs.current[index] = el; }} accept="image/*" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file)
                            handleImageUpload(index, file);
                    }} className="hidden"/>
                            {block.imageUrl ? (<div>
                                <div className="relative">
                                  <img className="w-full h-32" src={block.imageUrl} alt="Preview"/>
                                  <button onClick={() => handleRemoveImage(index)} className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center">
                                    <span aria-hidden="true">{iconLabel("ri-close-line text-white text-sm")}</span>
                                  </button>
                                </div>
                                <button className="w-full" onClick={() => fileInputRefs.current[index]?.click()}>
                                  Change Image
                                </button>
                              </div>) : (<button onClick={() => fileInputRefs.current[index]?.click()} className="w-full flex flex-col items-center justify-center gap-2">
                                <span aria-hidden="true">{iconLabel("ri-upload-cloud-line text-slate-400 text-2xl")}</span>
                                <span>Click to upload image</span>
                                <span>PNG, JPG, GIF up to 10MB</span>
                              </button>)}
                          </div>
                        </>)}
                    </div>)}
                </div>))}
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button className="flex-1" onClick={onCancel}>
            Cancel
          </button>
          <button className="flex-1" onClick={handleSubmit}>
            Save Section
          </button>
        </div>
      </div>

      <div>
        <h3>Live Preview</h3>
        <div className="overflow-hidden">
          <p>This is how your section will appear on the About page:</p>
          
          <div className={uiClasses(`${formData.backgroundColor} rounded-xl p-8`)}>
            <div>
              <h2>{formData.title || 'Section Title'}</h2>
              {formData.subtitle && (<p>{formData.subtitle}</p>)}
            </div>

            <div className={uiClasses(`grid ${getGridCols()} gap-6`)}>
              {formData.blocks.map((block) => (<div key={block.id}>
                  {block.type === 'image' ? (<div className="overflow-hidden">
                      {block.imageUrl ? (<img className="w-full h-48" src={block.imageUrl} alt="Content"/>) : (<div className="w-full h-48 flex items-center justify-center">
                          <span aria-hidden="true">{iconLabel("ri-image-line text-slate-400 text-3xl")}</span>
                        </div>)}
                    </div>) : formData.isCard ? (<div className="h-full">
                      {formData.cardType === 'icon' && (<div className={uiClasses(`w-14 h-14 ${block.iconColor || 'bg-blue-600'} rounded-xl flex items-center justify-center mx-auto mb-4`)}>
                          <span aria-hidden="true">{iconLabel(`${block.icon || 'ri-star-line'} text-white text-xl`)}</span>
                        </div>)}
                      {formData.cardType === 'image' && (<div className="w-full h-32 overflow-hidden">
                          {block.imageUrl ? (<img className="w-full h-full" src={block.imageUrl} alt=""/>) : (<div className="w-full h-full flex items-center justify-center">
                              <span aria-hidden="true">{iconLabel("ri-image-line text-slate-400 text-2xl")}</span>
                            </div>)}
                        </div>)}
                      <h3>{block.title || 'Block Title'}</h3>
                      <div className="max-w-none" dangerouslySetInnerHTML={{
                    __html: block.description || '',
                }}/>
                      
                    </div>) : (<div className="h-full">
                      <h3>{block.title || 'Block Title'}</h3>
                      <div className="max-w-none" dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(block.description || ''),
                }}/>
                      
                    </div>)}
                </div>))}
            </div>
          </div>
        </div>
      </div>
    </div>);
}

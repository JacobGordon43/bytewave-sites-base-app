import { uiClasses, iconLabel } from "../../utils/presentation";
import { useState } from 'react';
import type { FAQSectionData } from '../../types/daoTypes';
import { v4 as uuidv4 } from "uuid";
interface FAQEditorProps {
    section: FAQSectionData | null;
    totalSections: number;
    onSave: (section: FAQSectionData) => void;
    onCancel: () => void;
}
export default function FAQEditor({ section, totalSections, onSave, onCancel }: FAQEditorProps) {
    const [formData, setFormData] = useState<FAQSectionData>(section || {
        id: uuidv4(),
        index: totalSections,
        title: '',
        faqs: [{ id: '1', question: '', answer: '' }]
    });
    const [expandedFAQ, setExpandedFAQ] = useState<string | null>(formData.faqs[0]?.id || null);
    const handleAddFAQ = () => {
        const newFAQ = { id: Date.now().toString(), question: '', answer: '' };
        setFormData({
            ...formData,
            faqs: [...formData.faqs, newFAQ]
        });
        setExpandedFAQ(newFAQ.id);
    };
    const handleRemoveFAQ = (faqId: string) => {
        if (formData.faqs.length <= 1)
            return;
        const newFaqs = formData.faqs.filter(f => f.id !== faqId);
        setFormData({
            ...formData,
            faqs: newFaqs
        });
        if (expandedFAQ === faqId) {
            setExpandedFAQ(newFaqs[0]?.id || null);
        }
    };
    const handleUpdateFAQ = (faqId: string, field: 'question' | 'answer', value: string) => {
        setFormData({
            ...formData,
            faqs: formData.faqs.map(f => f.id === faqId ? { ...f, [field]: value } : f)
        });
    };
    const handleMoveFAQ = (faqId: string, direction: 'up' | 'down') => {
        const index = formData.faqs.findIndex(f => f.id === faqId);
        if ((direction === 'up' && index === 0) ||
            (direction === 'down' && index === formData.faqs.length - 1))
            return;
        const newFaqs = [...formData.faqs];
        const swapIndex = direction === 'up' ? index - 1 : index + 1;
        [newFaqs[index], newFaqs[swapIndex]] = [newFaqs[swapIndex], newFaqs[index]];
        setFormData({ ...formData, faqs: newFaqs });
    };
    const handleSubmit = () => {
        if (!formData.title.trim())
            return;
        const validFaqs = formData.faqs.filter(f => f.question.trim() && f.answer.trim());
        if (validFaqs.length === 0)
            return;
        onSave({ ...formData, faqs: validFaqs });
    };
    const isValid = formData.title.trim() && formData.faqs.some(f => f.question.trim() && f.answer.trim());
    return (<div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
      <div>
        <div className="flex items-center justify-between">
          <h3>
            {section ? 'Edit FAQ Section' : 'Create FAQ Section'}
          </h3>
        </div>

        <div>
          <label className="block">Section Title</label>
          <input className="w-full" type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g., General Questions, Pricing & Billing"/>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label>Questions ({formData.faqs.length})</label>
            <button onClick={handleAddFAQ} className="flex items-center gap-1">
              <span aria-hidden="true">{iconLabel("ri-add-line")}</span> Add Question
            </button>
          </div>

          <div className="max-h-[500px] overflow-y-auto">
            {formData.faqs.map((faq, index) => (<div key={faq.id} className={uiClasses(`bg-slate-700/50 rounded-lg border ${expandedFAQ === faq.id ? 'border-blue-500' : 'border-slate-600'} overflow-hidden`)}>
                <div className="flex items-center justify-between" onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span>Q{index + 1}</span>
                    <span>
                      {faq.question || 'New Question'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={(e) => { e.stopPropagation(); handleMoveFAQ(faq.id, 'up'); }} disabled={index === 0} className={uiClasses(`w-7 h-7 flex items-center justify-center rounded transition-colors ${index === 0 ? 'text-slate-600' : 'text-slate-400 hover:text-white hover:bg-slate-600 cursor-pointer'}`)}>
                      <span aria-hidden="true">{iconLabel("ri-arrow-up-s-line")}</span>
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleMoveFAQ(faq.id, 'down'); }} disabled={index === formData.faqs.length - 1} className={uiClasses(`w-7 h-7 flex items-center justify-center rounded transition-colors ${index === formData.faqs.length - 1 ? 'text-slate-600' : 'text-slate-400 hover:text-white hover:bg-slate-600 cursor-pointer'}`)}>
                      <span aria-hidden="true">{iconLabel("ri-arrow-down-s-line")}</span>
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleRemoveFAQ(faq.id); }} disabled={formData.faqs.length <= 1} className={uiClasses(`w-7 h-7 flex items-center justify-center rounded transition-colors ${formData.faqs.length <= 1 ? 'text-slate-600' : 'text-red-400 hover:text-red-300 hover:bg-slate-600 cursor-pointer'}`)}>
                      <span aria-hidden="true">{iconLabel("ri-delete-bin-line")}</span>
                    </button>
                    <span aria-hidden="true">{iconLabel(`ri-arrow-down-s-line text-slate-400 transition-transform ${expandedFAQ === faq.id ? 'rotate-180' : ''}`)}</span>
                  </div>
                </div>

                {expandedFAQ === faq.id && (<div>
                    <div>
                      <label className="block">Question</label>
                      <input className="w-full" type="text" value={faq.question} onChange={(e) => handleUpdateFAQ(faq.id, 'question', e.target.value)} placeholder="Enter the question..."/>
                    </div>
                    <div>
                      <label className="block">Answer</label>
                      <textarea className="w-full" value={faq.answer} onChange={(e) => handleUpdateFAQ(faq.id, 'answer', e.target.value.slice(0, 500))} placeholder="Enter the answer..." rows={4} maxLength={500}/>
                      <div>
                        {faq.answer.length}/500
                      </div>
                    </div>
                  </div>)}
              </div>))}
          </div>
        </div>

        <div className="flex gap-3">
          <button className="flex-1" onClick={onCancel}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={!isValid} className={uiClasses(`flex-1 py-3 rounded-lg transition-colors whitespace-nowrap ${isValid ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer' : 'bg-slate-600 text-slate-400 cursor-not-allowed'}`)}>
            Save Section
          </button>
        </div>
      </div>

      <div>
        <h3>Live Preview</h3>
        <div>
          <p>This is how your FAQ section will appear on the FAQ page:</p>

          <div>
            <h2>
              {formData.title || 'Section Title'}
            </h2>

            <div>
              {formData.faqs.filter(f => f.question || f.answer).map((faq) => (<div className="overflow-hidden" key={faq.id}>
                  <div className="flex items-center justify-between">
                    <h3>
                      {faq.question || 'Question goes here...'}
                    </h3>
                    <div className="flex-shrink-0">
                      <span aria-hidden="true">{iconLabel("ri-arrow-down-s-line text-slate-400 text-xl")}</span>
                    </div>
                  </div>
                  <div>
                    <p>
                      {faq.answer || 'Answer goes here...'}
                    </p>
                  </div>
                </div>))}

              {formData.faqs.every(f => !f.question && !f.answer) && (<div>
                  <span aria-hidden="true">{iconLabel("ri-question-line text-3xl mb-2")}</span>
                  <p>Add questions to see preview</p>
                </div>)}
            </div>
          </div>
        </div>
      </div>
    </div>);
}

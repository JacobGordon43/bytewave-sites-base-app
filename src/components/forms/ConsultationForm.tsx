import { iconLabel } from "../../utils/presentation";
import { useRef, useState } from "react";
import adminService from "../../services/adminService";
import TurnstileWidget from "../TurnstileWidget";
import FeedbackMessage from "../FeedbackMessage";
export default function ConsultationForm() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<null | "success" | "error">(null);
    const [error, setError] = useState("");
    const consultationRef = useRef<HTMLFormElement>(null);
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!consultationRef.current || isSubmitting)
            return;
        setIsSubmitting(true);
        setSubmitStatus(null);
        setError("");
        try {
            const formData = new FormData(consultationRef.current);
            formData.set("type", "consultation");
            formData.set("turnstileToken", formData.get("cf-turnstile-response")?.toString() || "");
            const uploaded = await adminService.createContactSubmission(formData);
            if (!uploaded?.success)
                throw new Error(uploaded?.message || "Unable to submit consultation.");
            setSubmitStatus("success");
            consultationRef.current.reset();
        }
        catch (error) {
            setError(error instanceof Error ? error.message : "Unable to submit consultation.");
            setSubmitStatus("error");
        }
        finally {
            setIsSubmitting(false);
        }
    };
    return (<div>
      <h3>Free Consultation</h3>
      
      {submitStatus === 'success' && (<FeedbackMessage type="success" message="Thank you! We'll contact you within 24 hours." onClose={() => setSubmitStatus(null)}/>)}
      
      {submitStatus === 'error' && (<FeedbackMessage type="error" message={error || "Something went wrong. Please try again."} onClose={() => setSubmitStatus(null)}/>)}

      <form ref={consultationRef} onSubmit={handleSubmit} data-readdy-form id="consultation">
        <div>
          <input className="w-full" type="text" name="name" placeholder="Full Name *" required/>
        </div>

        <div>
          <input className="w-full" type="email" name="email" placeholder="Email Address *" required/>
        </div>

        <div>
          <input className="w-full" type="tel" name="phone" placeholder="Phone Number"/>
        </div>

        <div>
          <input className="w-full" type="text" name="company" placeholder="Company Name"/>
        </div>

        <div>
          <div className="relative">
            <select className="w-full" name="projectType">
              <option value="">Project Type</option>
              <option value="website-development">Website Development</option>
              <option value="website-design">Website Design</option>
              <option value="hosting">Web Hosting</option>
              <option value="aws-solution">AWS Solution</option>
              <option value="full-package">Complete Package</option>
            </select>

            <div className="absolute inset-y-0 right-0 flex items-center pointer-events-none">
              <span aria-hidden="true">{iconLabel("ri-arrow-down-s-line text-slate-400")}</span>
            </div>
          </div>
        </div>

        <div>
          <textarea className="w-full" name="description" required placeholder="Tell us about your project..." maxLength={500} rows={4}/>
          <div>
            
          </div>
        </div>

        <div>
          <TurnstileWidget />
        </div>

        <button className="w-full" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Sending...' : 'Get Free Consultation'}
        </button>
      </form>
    </div>);
}

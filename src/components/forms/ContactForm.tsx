import { iconLabel } from "../../utils/presentation";
import { useRef, useState } from "react";
import TurnstileWidget from "../TurnstileWidget";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../redux/store";
import { clearContactError, createContactSubmission } from "../../redux/contactSlice";
import FeedbackMessage from "../FeedbackMessage";
export default function ContactForm() {
    const [success, setSuccess] = useState(false);
    const contactRef = useRef<HTMLFormElement>(null);
    const dispatch = useDispatch<AppDispatch>();
    const contactSlice = useSelector((state: RootState) => state.contact);
    const handleSubmit = async (e: React.SubmitEvent) => {
        e.preventDefault();
        setSuccess(false);
        if (!contactRef.current)
            return;
        const formData = new FormData(contactRef.current);
        const turnstileToken = formData.get("cf-turnstile-response")?.toString() || "";
        formData.set("turnstileToken", turnstileToken);
        formData.set("type", "contact");
        try {
            const uploaded = await dispatch(createContactSubmission(formData)).unwrap();
            if (uploaded) {
                setSuccess(true);
                contactRef.current.reset();
            }
        }
        catch {
        }
    };
    return (<div className="h-full flex flex-col">
      <h2>
        Send us a Message
      </h2>

      {success && (<FeedbackMessage type="success" message="Thank you! We should get back to you within 24 hours." onClose={() => setSuccess(false)}/>)}

      {contactSlice.error && (<FeedbackMessage type="error" message={contactSlice.error} onClose={() => dispatch(clearContactError())}/>)}

      <form ref={contactRef} onSubmit={handleSubmit} id="contact" className="flex flex-col flex-1 justify-between">
        <div>
          <input className="w-full" type="text" name="name" placeholder="Full Name *" required/>

          <input className="w-full" type="email" name="email" placeholder="Email Address *" required/>

          <input className="w-full" type="tel" name="phone" placeholder="Phone Number"/>

          <input className="w-full" type="text" name="company" placeholder="Company Name"/>

          <div className="relative">
            <select className="w-full" name="subject" required>
              <option value="">Select Subject *</option>
              <option value="web-development">Web Development</option>
              <option value="web-design">Web Design</option>
              <option value="hosting">Web Hosting</option>
              <option value="aws-solution">AWS Solution</option>
              <option value="support">Technical Support</option>
              <option value="other">Other</option>
            </select>

            <div className="absolute inset-y-0 right-0 flex items-center pointer-events-none">
              <span aria-hidden="true">{iconLabel("ri-arrow-down-s-line text-slate-400")}</span>
            </div>
          </div>

          <textarea className="w-full" name="message" required placeholder="Tell us about your project or question..." maxLength={500} rows={6}/>
          <TurnstileWidget />

        </div>
        <button className="w-full" type="submit" disabled={contactSlice.loadingUpload}>
          {contactSlice.loadingUpload ? "Sending..." : "Send Message"}
        </button>
      </form>
    </div>);
}

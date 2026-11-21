import { useEffect } from "react";
import { signOut } from "@aws-amplify/auth";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../redux/store";
import { resetClientSlice } from "../redux/clientSlice";
import { resetPaymentSlice } from "../redux/paymentsSlice";
import { resetProjectSlice } from "../redux/projectSlice";
import { resetTicketSlice } from "../redux/ticketsSlice";
import { resetAdditionalInfoSlice } from "../redux/additionalInfoSlice";
import { resetHostingSlice } from "../redux/hostingSlice";
import { resetWorkOrderSlice } from "../redux/workOrderSlice";
import { resetContactSlice } from "../redux/contactSlice";
import { clearStripeCatalog } from "../redux/stripeCatalogSlice";
export default function Logout() {
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();
    useEffect(() => {
        const logout = async () => {
            try {
                await signOut();
            }
            catch (err) {
                console.error("Error signing out:", err);
            }
            finally {
                dispatch(resetClientSlice());
                dispatch(resetPaymentSlice());
                dispatch(resetProjectSlice());
                dispatch(resetTicketSlice());
                dispatch(resetAdditionalInfoSlice());
                dispatch(resetHostingSlice());
                dispatch(resetWorkOrderSlice());
                dispatch(resetContactSlice());
                dispatch(clearStripeCatalog());
                navigate('/login', { replace: true });
            }
        };
        void logout();
    }, [dispatch, navigate]);
    return null;
}

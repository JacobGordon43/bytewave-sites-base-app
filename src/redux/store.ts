import stripeCatalogReducer from "./stripeCatalogSlice";
import { clearStripeCatalog } from "./stripeCatalogSlice";
import { resetClientSlice } from "./clientSlice";
import { resetPaymentSlice } from "./paymentsSlice";
import { resetProjectSlice } from "./projectSlice";
import { resetTicketSlice } from "./ticketsSlice";
import { resetAdditionalInfoSlice } from "./additionalInfoSlice";
import { resetHostingSlice } from "./hostingSlice";
import { resetWorkOrderSlice } from "./workOrderSlice";
import { resetContactSlice } from "./contactSlice";
import { Hub } from "aws-amplify/utils";
import { combineReducers, configureStore } from "@reduxjs/toolkit";
import clientReducer from "./clientSlice"
import paymentReducer from "./paymentsSlice"
import projectReducer from "./projectSlice"
// import visitorReducer from "./visitorsSlice"
import ticketsReducer from "./ticketsSlice";
import hostingReducer from "./hostingSlice";
import aboutReducer from "./aboutSlice";
import faqReducer from "./faqSlice"
import servicesReducer from "./servicesSlice"
import additionalInfoReducer from "./additionalInfoSlice";
import portfolioReducer from "./portfolioSlice";
import workOrderReducer from "./workOrderSlice";
import contactReducer from "./contactSlice";
import statusReducer from "./statusSlice";
import businessInfoReducer from "./businessSlice";
import { createMigrate, persistStore, persistReducer } from "redux-persist";
import type { PersistedState } from "redux-persist/es/types";
import storageSession from "redux-persist/es/storage/session";
import { FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from "redux-persist";

//ADD WORK ORDERS AND PORTFOLIO
const rootReducer = combineReducers({
    stripeCatalog: stripeCatalogReducer,
    clients: clientReducer,
    payments: paymentReducer,
    projects: projectReducer,
    // visitors: visitorReducer,
    tickets: ticketsReducer,
    additionalInfo: additionalInfoReducer,
    hosting: hostingReducer,
    about: aboutReducer,
    faq: faqReducer,
    services: servicesReducer,
    workOrders: workOrderReducer,
    portfolio: portfolioReducer,
    contact: contactReducer,
    status: statusReducer,
    businessInfo: businessInfoReducer
})
const migrations = {
    1: (state: PersistedState): PersistedState => {
        if (!state) return state;

        const migratedState = { ...state } as typeof state & { auth?: unknown };
        delete migratedState.auth;
        return migratedState;
    }
};

const persistConfig = {
    key: "root",
    blacklist: ["stripeCatalog"],
    version: 1,
    storage: storageSession,
    migrate: createMigrate(migrations)
}

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER]
            }
        })
});
export const persistor = persistStore(store);
Hub.listen("auth", ({ payload }) => {
    if (payload.event === "signedOut" || payload.event === "tokenRefresh_failure") {
        store.dispatch(resetClientSlice());
        store.dispatch(resetPaymentSlice());
        store.dispatch(resetProjectSlice());
        store.dispatch(resetTicketSlice());
        store.dispatch(resetAdditionalInfoSlice());
        store.dispatch(resetHostingSlice());
        store.dispatch(resetWorkOrderSlice());
        store.dispatch(resetContactSlice());
        store.dispatch(clearStripeCatalog());
    }
});
export type RootState = ReturnType<typeof persistedReducer>;
export type AppDispatch = typeof store.dispatch;
export default store;



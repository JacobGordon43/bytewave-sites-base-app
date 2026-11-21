import { contactAdapter } from "../adapters/contactAdapter"
import type { RootState } from "../store"

const adapterSelector = contactAdapter.getSelectors<RootState>((state)=>state.contact)
export const selectAllSubmissions = adapterSelector.selectAll;
import { aboutAdapter } from "../adapters/aboutAdapter"
import type { RootState } from "../store"

const adapterSelectors = aboutAdapter.getSelectors<RootState>((state)=>state.about)
export const selectAboutSections = adapterSelectors.selectAll
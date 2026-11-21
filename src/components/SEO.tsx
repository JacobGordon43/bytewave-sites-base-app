import { siteConfig } from "../config/site";
const SITE_URL = siteConfig.origin;
interface SEOProps {
    title: string;
    description?: string;
    canonicalPath?: string;
}
export default function SEO({ title, description, canonicalPath }: SEOProps) {
    const canonicalUrl = canonicalPath
        ? new URL(canonicalPath, SITE_URL).toString()
        : undefined;
    return (<>
      <title>{title}</title>
      {description && <meta name="description" content={description}/>}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl}/>}
    </>);
}

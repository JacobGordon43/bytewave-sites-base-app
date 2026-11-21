import { iconLabel } from "../utils/presentation";
import { useMemo, useState } from 'react';
import { selectPortfolio } from '../redux/selectors/portfolioSelector';
import { useSelector } from 'react-redux';
import ContentEmptyState from './ContentEmptyState';
export default function PortfolioGrid() {
    const [selectedCategory, setSelectedCategory] = useState('All');
    const projects = useSelector(selectPortfolio);
    const categories = useMemo(() => ['All', ...new Set(projects.map(p => p.category))], [projects]);
    const filteredProjects = selectedCategory === 'All'
        ? projects
        : projects.filter(project => project.category === selectedCategory);
    return (<section>
      <div>
        <div>
          <h2>Recent Projects</h2>
          <p>
            From startups to enterprises, we've helped businesses of all sizes succeed
          </p>
          
          
          <div className="max-w-md">
            <div className="relative">
              <select className="w-full" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                {categories.map((category) => (<option key={category} value={category}>
                    {category} {category === 'All' ? 'Businesses' : ''}
                  </option>))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pointer-events-none">
                <span aria-hidden="true">{iconLabel("ri-arrow-down-s-line text-slate-400")}</span>
              </div>
            </div>
          </div>
        </div>

        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProjects.map((project) => (<div className="relative group overflow-hidden h-64" key={project.id}>
              <img className="w-full h-full group-hover:scale-110" src={project.imageUrl} alt={project.title + " home page"}/>
              
              
                <div className="absolute inset-0 flex items-center justify-center">                
                <div className="transform translate-y-4 group-hover:translate-y-0 opacity-100 lg:opacity-0 lg:group-hover:opacity-100">
                  <h3>{project.title}</h3>
                  <p>
                    {project.description}
                  </p>
                  <a href={project.website} rel='noopener noreferrer' target="_blank" className="inline-flex items-center">
                    Visit Website
                    <span aria-hidden="true">{iconLabel("ri-external-link-line ml-2")}</span>
                  </a>
                </div>
              </div>
              
              
              <div className="absolute top-4 left-4">
                {project.category}
              </div>
            </div>))}
        </div>

        {projects.length === 0 ? (<ContentEmptyState title="Our Work" description="Completed projects and examples of our work will appear here when available."/>) : filteredProjects.length === 0 && (<div>
            <p>No projects found for the selected category.</p>
          </div>)}
      </div>
    </section>);
}

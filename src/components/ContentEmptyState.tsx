type ContentEmptyStateProps = {
    title: string;
    description: string;
};
export default function ContentEmptyState({ title, description }: ContentEmptyStateProps) {
    return (<div className="w-full">
      <h2>{title}</h2>
      <p>{description}</p>
    </div>);
}

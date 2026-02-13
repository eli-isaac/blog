import useDocumentMeta from '../hooks/useDocumentMeta'

export default function Projects() {
  useDocumentMeta({
    title: 'Projects',
    description: 'Projects and experiments from the Arrowsmith team.',
  })

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Projects</h1>
      <p className="text-gray-600">
        Projects coming soon...
      </p>
    </div>
  )
}

import PostsList from '../components/Posts'
import useDocumentMeta from '../hooks/useDocumentMeta'

export default function Posts() {
  useDocumentMeta({
    title: 'Posts',
    description: 'All articles on Arrowsmith — covering machine learning, neural networks, optimization techniques, and philosophy.',
  })

  return <PostsList />
}

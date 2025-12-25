import PostPage from '../../components/PostPage'

export default function ActivationFunctions() {
  return (
    <PostPage
      title="Activation Functions in Neural Networks"
      subtitle="A chronological consideration of the most popular activation functions"
      date="2025-12-25"
      slug="activation-functions-in-neural-networks"
    >
      <p className="text-gray-700 leading-relaxed mb-6">
        Activation functions are a fundamental component of neural networks, introducing non-linearity 
        that allows networks to learn complex patterns. Without them, a neural network would simply be 
        a linear transformation, regardless of depth.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-4" style={{ fontFamily: "'Georgia', serif" }}>
        The Sigmoid Function
      </h2>
      
      <p className="text-gray-700 leading-relaxed mb-6">
        One of the earliest activation functions, the sigmoid squashes values between 0 and 1. 
        It was popular in the early days of neural networks due to its smooth gradient and 
        probabilistic interpretation.
      </p>

      <img 
        src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Logistic-curve.svg/1200px-Logistic-curve.svg.png" 
        alt="Sigmoid function curve"
        className="w-full rounded-lg mb-6"
      />

      <h2 className="text-xl font-semibold mt-8 mb-4" style={{ fontFamily: "'Georgia', serif" }}>
        ReLU: The Modern Standard
      </h2>

      <p className="text-gray-700 leading-relaxed mb-6">
        The Rectified Linear Unit (ReLU) revolutionized deep learning. Its simplicity—outputting 
        zero for negative inputs and the input itself for positive values—makes it computationally 
        efficient and helps mitigate the vanishing gradient problem.
      </p>

      <img 
        src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/ReLU_and_GELU.svg/1200px-ReLU_and_GELU.svg.png" 
        alt="ReLU and GELU comparison"
        className="w-full rounded-lg mb-6"
      />

      <h2 className="text-xl font-semibold mt-8 mb-4" style={{ fontFamily: "'Georgia', serif" }}>
        Looking Forward
      </h2>

      <p className="text-gray-700 leading-relaxed mb-6">
        Modern architectures continue to experiment with activation functions. GELU, used in 
        transformers like GPT, and Swish, developed by Google, represent the current frontier. 
        The search for better activation functions remains an active area of research.
      </p>

      <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600 my-8">
        "The choice of activation function can make or break a neural network's ability to learn."
      </blockquote>

      <p className="text-gray-700 leading-relaxed">
        As we push towards more efficient and capable models, understanding these fundamental 
        building blocks becomes ever more important.
      </p>
    </PostPage>
  )
}

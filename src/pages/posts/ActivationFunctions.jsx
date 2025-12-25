import PostPage from '../../components/PostPage'
import { Inline, Block } from '../../components/Math'
import ActivationGraph from '../../components/ActivationGraph'
import NeuralNetworkDemo from '../../components/NeuralNetworkDemo'

function Section({ title, children }) {
  return (
    <section className="mt-12">
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      {children}
    </section>
  )
}

function P({ children }) {
  return <p className="text-gray-700 leading-relaxed mb-4">{children}</p>
}

function Reference({ children }) {
  return <span className="text-gray-500">({children})</span>
}

export default function ActivationFunctions() {
  return (
    <PostPage
      title="Activation Functions"
      subtitle="Why neural networks need non-linearity"
      date="2025-12-25"
      slug="activation-functions-in-neural-networks"
    >
      <Section title="Intro">
        <P>
          An activation function is a <strong>non-linear</strong> function used inside a neural network, 
          usually applied element-wise right after a linear transformation. A typical layer computes:
        </P>
        
        <Block>{'z = Wx + b, \\quad a = \\phi(z)'}</Block>
        
        <P>
          where <Inline>{'W'}</Inline> and <Inline>{'b'}</Inline> define a linear (more precisely, affine) 
          map and <Inline>{'\\phi'}</Inline> is the activation function.
        </P>

        <P>
          Activation functions are necessary because without them, a neural network can only represent 
          linear or affine functions of its input. A linear (affine) function is one where the output 
          is a weighted sum of the inputs plus a constant offset. Each input feature affects the output 
          independently and in a fixed way: increasing a feature always increases or decreases the output 
          at a constant rate. There is no notion of thresholds, changing behavior, or interactions between inputs.
        </P>

        <P>
          In two dimensions, a linear function corresponds to a straight line (or a flat plane when 
          mapping from 2D to 1D). Non-linear functions curve, bend, or change slope.
        </P>
      </Section>

      <Section title="Early history and step functions">
        <P>
          The earliest activation functions were motivated by biological neurons. The idea was simple: 
          compute a weighted sum of inputs, then decide whether the neuron "fires" or not.
        </P>

        <P>
          This led to the <strong>step function</strong>, used in early models such as the McCulloch–Pitts 
          neuron and Rosenblatt's perceptron <Reference>McCulloch & Pitts, 1943; Rosenblatt, 1958</Reference>:
        </P>

        <Block>{'\\text{step}(z) = \\begin{cases} 1 & z \\ge 0 \\\\ 0 & z < 0 \\end{cases}'}</Block>

        <ActivationGraph type="step" />

        <P>
          While conceptually simple, this function has a fatal flaw for modern training methods. It is 
          not differentiable at the threshold, and its derivative is zero everywhere else. As a result, 
          small changes to the input almost never produce any change in the output.
        </P>

        <P>
          As gradient-based training methods such as backpropagation became 
          standard <Reference>Rumelhart, Hinton & Williams, 1986</Reference>, differentiability became 
          essential. Backpropagation relies on gradients to tell each parameter which direction to move 
          in order to reduce the loss.
        </P>

        <P>
          With a step function, the gradient is either undefined or zero, providing no signal for how 
          to adjust the weights. Even if a neuron is "close" to flipping from 0 to 1, the gradient 
          gives no indication of that. Backpropagation simply cannot function under these conditions.
        </P>
      </Section>

      <Section title="Smooth activations and the logistic sigmoid">
        <P>
          To address this, step functions were replaced by smooth, differentiable alternatives. The most 
          prominent early example is the <strong>logistic sigmoid</strong> (often just called <em>sigmoid</em>):
        </P>

        <Block>{'\\sigma(z) = \\frac{1}{1 + e^{-z}}'}</Block>

        <ActivationGraph type="sigmoid" />

        <P>
          This function behaves like a softened step: large negative inputs map close to 0, large positive 
          inputs map close to 1, and the transition between them is smooth. Crucially, it has a well-defined 
          derivative everywhere:
        </P>

        <Block>{"\\sigma'(z) = \\sigma(z)\\bigl(1 - \\sigma(z)\\bigr)"}</Block>

        <P>
          Unlike a step function, shifting the input slightly always produces at least a small change in 
          the output. This allows gradients to propagate backward through the network, enabling effective 
          training via backpropagation.
        </P>

        <P>
          Over time, however, the motivation for activation functions shifted away from biological realism. 
          What ultimately mattered was not that these functions resembled neurons, but that they 
          introduced <strong>non-linearity</strong>.
        </P>
      </Section>

      <Section title="Why non-linearity matters">
        <P>
          Without a non-linearity, every layer in a neural network performs a linear (affine) transformation. 
          Stacking such layers does not increase expressive power: composing linear functions simply results 
          in another linear function.
        </P>

        <P>
          For example, two layers:
        </P>

        <Block>{'h = W_1x + b_1, \\quad y = W_2h + b_2'}</Block>

        <P>collapse into:</P>

        <Block>{'y = (W_2W_1)x + (W_2b_1 + b_2)'}</Block>

        <P>
          which is just a single affine map. Depth alone achieves nothing if no non-linearities are present.
        </P>

        <P>
          This limitation is severe. Linear functions cannot:
        </P>

        <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
          <li>change behavior after a threshold</li>
          <li>vary the rate at which outputs grow or shrink</li>
          <li>model interactions where one input only matters when another lies in a specific range</li>
        </ul>

        <P>
          They are restricted to additive effects of the form <Inline>{'ax + by'}</Inline>.
        </P>

        <P>
          Introducing a non-linear activation breaks this collapse. Once a non-linearity is applied, layers 
          can no longer be merged into a single linear map. By stacking linear transformations with non-linear 
          activations, neural networks can build increasingly rich representations and, with enough capacity, 
          approximate highly complex functions <Reference>Cybenko, 1989</Reference>.
        </P>

        <NeuralNetworkDemo />
      </Section>

      <Section title="Common activation functions">
        <h3 className="text-lg font-semibold mt-8 mb-3">Step function</h3>
        
        <Block>{'\\text{step}(z) = \\begin{cases} 1 & z \\ge 0 \\\\ 0 & z < 0 \\end{cases}'}</Block>
        
        <ActivationGraph type="step" />
        
        <P>
          Historically important as the first activation function used in neural models, but incompatible 
          with gradient-based learning due to non-differentiability and zero 
          gradients <Reference>McCulloch & Pitts, 1943; Rosenblatt, 1958</Reference>.
        </P>

        <h3 className="text-lg font-semibold mt-8 mb-3">Logistic sigmoid</h3>
        
        <Block>{'\\sigma(z) = \\frac{1}{1 + e^{-z}}'}</Block>
        
        <ActivationGraph type="sigmoid" />
        
        <P>
          Introduced as a differentiable alternative to the step function, enabling the use of 
          backpropagation in multi-layer networks <Reference>Rumelhart et al., 1986</Reference>. Its output 
          range <Inline>{'(0,1)'}</Inline> made it natural for probabilistic interpretations.
        </P>
        
        <P>
          However, sigmoid saturates for large positive or negative inputs, leading to vanishing gradients 
          and slow training in deep networks.
        </P>

        <h3 className="text-lg font-semibold mt-8 mb-3">Tanh</h3>
        
        <Block>{'\\tanh(z) = \\frac{e^z - e^{-z}}{e^z + e^{-z}}'}</Block>
        
        <ActivationGraph type="tanh" yRange={[-1.5, 1.5]} />
        
        <P>
          A rescaled and shifted sigmoid mapping inputs to <Inline>{'(-1, 1)'}</Inline>. Being zero-centered 
          often improves optimization compared to sigmoid. Like sigmoid, tanh suffers from saturation and 
          vanishing gradients at large magnitudes.
        </P>

        <h3 className="text-lg font-semibold mt-8 mb-3">ReLU (Rectified Linear Unit)</h3>
        
        <Block>{'\\text{ReLU}(z) = \\max(0, z)'}</Block>
        
        <ActivationGraph type="relu" yRange={[-1, 5]} />
        
        <P>
          Introduced to address saturation issues in sigmoid and tanh. ReLU is simple, computationally 
          efficient, and maintains strong gradients for positive inputs, which made deep networks much 
          easier to train <Reference>Nair & Hinton, 2010</Reference>.
        </P>
        
        <P>
          Its main drawback is the "dying ReLU" problem, where neurons can become stuck outputting zero 
          if they consistently receive negative inputs.
        </P>

        <h3 className="text-lg font-semibold mt-8 mb-3">Leaky ReLU</h3>
        
        <Block>{'\\text{LeakyReLU}(z) = \\max(\\alpha z, z), \\quad \\alpha \\ll 1'}</Block>
        
        <ActivationGraph type="leakyRelu" yRange={[-1, 5]} />
        
        <P>
          Proposed to mitigate dying ReLUs by allowing a small, non-zero gradient for negative inputs. 
          This helps keep neurons active during training while preserving most benefits of ReLU.
        </P>

        <h3 className="text-lg font-semibold mt-8 mb-3">GELU (Gaussian Error Linear Unit)</h3>
        
        <Block>{'\\text{GELU}(z) = z \\cdot \\Phi(z)'}</Block>
        
        <P>
          where <Inline>{'\\Phi(z)'}</Inline> is the CDF of the standard normal distribution.
        </P>
        
        <ActivationGraph type="gelu" yRange={[-1, 5]} />
        
        <P>
          GELU smoothly gates inputs based on their magnitude rather than applying a hard cutoff. It was 
          introduced to better match the behavior of stochastic regularization and has become standard 
          in Transformer architectures <Reference>Hendrycks & Gimpel, 2016</Reference>.
        </P>
      </Section>

      <Section title="Closing remark">
        <P>
          Activation functions exist to introduce non-linearity. Without them, neural networks collapse 
          into linear models regardless of depth. With them, simple linear building blocks can be composed 
          into systems capable of representing complex, highly structured functions.
        </P>
      </Section>

      <Section title="References">
        <ul className="text-sm text-gray-600 space-y-2">
          <li>McCulloch, W. S., & Pitts, W. (1943). <em>A logical calculus of the ideas immanent in nervous activity</em>.</li>
          <li>Rosenblatt, F. (1958). <em>The perceptron: A probabilistic model for information storage and organization in the brain</em>.</li>
          <li>Rumelhart, D. E., Hinton, G. E., & Williams, R. J. (1986). <em>Learning representations by back-propagating errors</em>.</li>
          <li>Cybenko, G. (1989). <em>Approximation by superpositions of a sigmoidal function</em>.</li>
          <li>Nair, V., & Hinton, G. E. (2010). <em>Rectified linear units improve restricted Boltzmann machines</em>.</li>
          <li>Hendrycks, D., & Gimpel, K. (2016). <em>Gaussian Error Linear Units (GELUs)</em>.</li>
        </ul>
      </Section>
    </PostPage>
  )
}

import { registerCard } from '../../../sdk/registry'
import ChalkBoardCard from './ChalkBoardCard'
import cardCss from './ChalkBoardCard.css?inline'

;(function injectStyles() {
  const style = document.createElement('style')
  style.setAttribute('data-card', 'chalkboard')
  style.textContent = cardCss
  document.head.appendChild(style)
})()

registerCard({
  type: 'chalkboard',
  label: 'Chalkboard',
  icon: '🖊️',
  group: 'Static',
  defaultSize: [2, 2],
  minSize: [2, 2],
  needsEntity: false,
  component: ChalkBoardCard,
})

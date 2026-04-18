import { registerCard } from '../../../sdk/registry'
import AvgangstavlanCard from './AvgangstavlanCard'
import AvgangstavlanConfigUI from './AvgangstavlanConfigUI'
import cardCss from './AvgangstavlanCard.css?inline'
import searchCss from './StopAreaSearch.css?inline'

// Inject styles into the document
;(function injectStyles() {
  const style = document.createElement('style')
  style.setAttribute('data-card', 'avgangstavlan')
  style.textContent = cardCss + '\n' + searchCss
  document.head.appendChild(style)
})()

registerCard({
  type: 'avgangstavlan',
  label: 'Avgångstavlan (Västtrafik)',
  icon: '🚌',
  group: 'Transport',
  defaultSize: [3, 4],
  minSize: [1, 1],
  needsEntity: false,
  integrations: [
    {
      id: 'vasttrafik',
      label: 'Västtrafik API',
      testEndpoint: '/api/vasttrafik/test',
      helpText: 'Create an account and app at developer.vasttrafik.se. Copy all three values from your app page.',
      required: true,
      fields: [
        { key: 'vasttrafik_client_id',     label: 'Client ID (Klientidentifierare)',          type: 'text'   },
        { key: 'vasttrafik_client_secret', label: 'Client Secret (Hemlighet)',                type: 'secret' },
        { key: 'vasttrafik_auth_key',      label: 'Authentication Key (Autentiseringsnyckel)', type: 'secret' },
      ],
    },
  ],
  component: AvgangstavlanCard,
  configUI: AvgangstavlanConfigUI,
})
